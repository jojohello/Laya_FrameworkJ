const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "../..");
const assetsRoot = path.join(projectRoot, "assets");
const stylePath = path.join(assetsRoot, "config", "UITextStyle.json");

function collectFiles(directory, result) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            collectFiles(fullPath, result);
        } else if (entry.name.endsWith(".ls") || entry.name.endsWith(".lh")) {
            result.push(fullPath);
        }
    }
}

function normalizeColor(value) {
    return String(value || "").trim().toLowerCase();
}

function styleSignature(style) {
    return [
        Number(style.FontSize) || 0,
        normalizeColor(style.Color),
        Boolean(style.Bold),
        Number(style.Stroke) || 0,
        normalizeColor(style.StrokeColor),
        String(style.Align || ""),
        String(style.VAlign || ""),
        String(style.Font || ""),
    ].join("|");
}

function nodeSignature(node) {
    return styleSignature({
        FontSize: node.fontSize,
        Color: node.color,
        Bold: node.bold,
        Stroke: node.stroke,
        StrokeColor: node.strokeColor,
        Align: node.align,
        VAlign: node.valign,
        Font: node.font,
    });
}

function visit(node, filePath, parentPath, rows) {
    if (Array.isArray(node)) {
        for (const child of node) visit(child, filePath, parentPath, rows);
        return;
    }
    if (!node || typeof node !== "object") return;

    const nodeName = node.name || node._$id || node._$type || "node";
    const nodePath = parentPath ? `${parentPath}/${nodeName}` : nodeName;
    const nodeType = String(node._$type || "");
    if (nodeType.includes("Text") || Object.hasOwn(node, "text") || Object.hasOwn(node, "fontSize")) {
        rows.push({ filePath, nodePath, node });
    }

    for (const childKey of ["_$child", "child", "children"]) {
        if (node[childKey]) visit(node[childKey], filePath, nodePath, rows);
    }
}

if (!fs.existsSync(stylePath)) {
    console.error(`Missing generated style table: ${path.relative(projectRoot, stylePath)}`);
    console.error("Run: node Config/tools/exportClient.js");
    process.exit(1);
}

const styles = JSON.parse(fs.readFileSync(stylePath, "utf8"));
const stylesBySignature = new Map();
for (const style of styles) {
    const signature = styleSignature(style);
    const keys = stylesBySignature.get(signature) || [];
    keys.push(style.Key);
    stylesBySignature.set(signature, keys);
}

const files = [];
collectFiles(assetsRoot, files);
const rows = [];
for (const filePath of files.sort()) {
    visit(JSON.parse(fs.readFileSync(filePath, "utf8")), filePath, "", rows);
}

let invalidCount = 0;
let unmatchedCount = 0;
for (const row of rows) {
    const node = row.node;
    const relativeFile = path.relative(projectRoot, row.filePath).replaceAll("\\", "/");
    const matchedKeys = stylesBySignature.get(nodeSignature(node)) || [];
    if ((Number(node.stroke) || 0) > 0 && !normalizeColor(node.strokeColor)) {
        invalidCount++;
        console.error(`[invalid] ${relativeFile} :: ${row.nodePath} has stroke=${node.stroke} without strokeColor`);
    }
    if (matchedKeys.length === 0) {
        unmatchedCount++;
        console.warn(`[unmatched] ${relativeFile} :: ${row.nodePath}`);
    }
}

console.log(`Text nodes: ${rows.length}`);
console.log(`Semantic styles: ${styles.length}`);
console.log(`Unmatched nodes: ${unmatchedCount}`);
console.log(`Invalid nodes: ${invalidCount}`);

if (invalidCount > 0) process.exitCode = 1;
