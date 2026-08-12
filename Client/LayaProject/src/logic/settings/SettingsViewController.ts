import { App } from "../App";
import { UIManager } from "../ui/UIManager";

interface AudioSettingsBridge {
    getMusicVolume(): number;
    setMusicVolume(value: number): void;
    getSoundVolume(): number;
    setSoundVolume(value: number): void;
    getMusicMuted(): boolean;
    setMusicMuted(muted: boolean): void;
    getSoundMuted(): boolean;
    setSoundMuted(muted: boolean): void;
    getMasterMuted(): boolean;
    setMasterMuted(muted: boolean): void;
    playSound(url: string): unknown;
}

interface SliderBinding {
    button: Laya.GButton;
    fill: Laya.GImage;
    knob: Laya.GImage;
    getValue: () => number;
    setValue: (value: number) => void;
}

/** Main-scene audio settings page backed by the Start-bundle MusicMgr bridge. */
export class SettingsViewController {
    private static readonly CLICK_SOUND = "sound/click.mp3";
    private static readonly TOGGLE_ON = "ui/common/imgs/btn-bg-cyan.png";
    private static readonly TOGGLE_OFF = "ui/common/imgs/btn-bg-grey.png";

    private readonly _view: Laya.Scene;
    private readonly _audio: AudioSettingsBridge;
    private readonly _closeButton: Laya.GButton;
    private readonly _masterToggle: Laya.GButton;
    private readonly _musicToggle: Laya.GButton;
    private readonly _soundToggle: Laya.GButton;
    private readonly _musicSlider: SliderBinding;
    private readonly _soundSlider: SliderBinding;
    private _draggingSlider: SliderBinding | null = null;

    constructor(view: Laya.Scene) {
        this._view = view;
        this._audio = App.musicMgr as AudioSettingsBridge;
        this._closeButton = this.requireButton("closeButton");
        this._masterToggle = this.requireButton("masterToggle");
        this._musicToggle = this.requireButton("musicToggle");
        this._soundToggle = this.requireButton("soundToggle");
        this._musicSlider = this.createSlider("musicSlider", () => this._audio.getMusicVolume(),
            value => this._audio.setMusicVolume(value));
        this._soundSlider = this.createSlider("soundSlider", () => this._audio.getSoundVolume(),
            value => this._audio.setSoundVolume(value));
    }

    onOpened(): void {
        this.unbindEvents();
        this._closeButton.on(Laya.Event.CLICK, this, this.close);
        this._masterToggle.on(Laya.Event.CLICK, this, this.toggleMaster);
        this._musicToggle.on(Laya.Event.CLICK, this, this.toggleMusic);
        this._soundToggle.on(Laya.Event.CLICK, this, this.toggleSound);
        this._musicSlider.button.on(Laya.Event.MOUSE_DOWN, this, this.beginMusicDrag);
        this._soundSlider.button.on(Laya.Event.MOUSE_DOWN, this, this.beginSoundDrag);
        Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.onSliderDrag);
        Laya.stage.on(Laya.Event.MOUSE_UP, this, this.endSliderDrag);
        this.refresh();
    }

    onClosed(): void {
        this.unbindEvents();
    }

    private toggleMaster = (): void => {
        const muted = !this._audio.getMasterMuted();
        if (muted) this.playClick();
        this._audio.setMasterMuted(muted);
        this.refresh();
        if (!muted) this.playClick();
    };

    private toggleMusic = (): void => {
        const muted = !this._audio.getMusicMuted();
        if (muted) this.playClick();
        this._audio.setMusicMuted(muted);
        this.refresh();
        if (!muted) this.playClick();
    };

    private toggleSound = (): void => {
        const muted = !this._audio.getSoundMuted();
        if (muted) this.playClick();
        this._audio.setSoundMuted(muted);
        this.refresh();
        if (!muted) this.playClick();
    };

    private close = (): void => {
        this.playClick();
        UIManager.instance.close("SettingsUI");
    };

    private beginMusicDrag = (): void => this.beginSliderDrag(this._musicSlider);
    private beginSoundDrag = (): void => this.beginSliderDrag(this._soundSlider);

    private beginSliderDrag(slider: SliderBinding): void {
        this._draggingSlider = slider;
        this.updateSliderFromPointer(slider);
    }

    private onSliderDrag = (): void => {
        if (this._draggingSlider) this.updateSliderFromPointer(this._draggingSlider);
    };

    private endSliderDrag = (): void => {
        if (!this._draggingSlider) return;
        this.updateSliderFromPointer(this._draggingSlider);
        this._draggingSlider = null;
        this.playClick();
    };

    private updateSliderFromPointer(slider: SliderBinding): void {
        const local = slider.button.globalToLocal(new Laya.Point(Laya.stage.mouseX, Laya.stage.mouseY), true);
        const value = Math.max(0, Math.min(1, local.x / slider.button.width));
        slider.setValue(value);
        this.refreshSlider(slider);
    }

    private refresh(): void {
        this.refreshToggle(this._masterToggle, this._audio.getMasterMuted());
        this.refreshToggle(this._musicToggle, !this._audio.getMusicMuted());
        this.refreshToggle(this._soundToggle, !this._audio.getSoundMuted());
        this.refreshSlider(this._musicSlider);
        this.refreshSlider(this._soundSlider);
    }

    private refreshToggle(button: Laya.GButton, enabled: boolean): void {
        const background = button.getChildByName("background") as Laya.GImage;
        const label = button.getChildByName("label") as Laya.GTextField;
        if (background) (background as any).src = enabled
            ? SettingsViewController.TOGGLE_ON
            : SettingsViewController.TOGGLE_OFF;
        if (label) label.text = enabled ? "开" : "关";
    }

    private refreshSlider(slider: SliderBinding): void {
        const value = Math.max(0, Math.min(1, slider.getValue()));
        slider.fill.width = slider.button.width * value;
        slider.knob.x = slider.button.width * value;
    }

    private createSlider(name: string, getValue: () => number,
                         setValue: (value: number) => void): SliderBinding {
        const button = this.requireButton(name);
        const fill = button.getChildByName("fill") as Laya.GImage;
        const knob = button.getChildByName("knob") as Laya.GImage;
        if (!fill || !knob) throw new Error(`[SettingsUI] slider children missing: ${name}`);
        return { button, fill, knob, getValue, setValue };
    }

    private requireButton(name: string): Laya.GButton {
        const button = this._view.getChildByName(name) as Laya.GButton;
        if (!button) throw new Error(`[SettingsUI] button missing: ${name}`);
        return button;
    }

    private playClick(): void {
        this._audio.playSound(SettingsViewController.CLICK_SOUND);
    }

    private unbindEvents(): void {
        this._draggingSlider = null;
        this._closeButton.off(Laya.Event.CLICK, this, this.close);
        this._masterToggle.off(Laya.Event.CLICK, this, this.toggleMaster);
        this._musicToggle.off(Laya.Event.CLICK, this, this.toggleMusic);
        this._soundToggle.off(Laya.Event.CLICK, this, this.toggleSound);
        this._musicSlider.button.off(Laya.Event.MOUSE_DOWN, this, this.beginMusicDrag);
        this._soundSlider.button.off(Laya.Event.MOUSE_DOWN, this, this.beginSoundDrag);
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onSliderDrag);
        Laya.stage.off(Laya.Event.MOUSE_UP, this, this.endSliderDrag);
    }
}
