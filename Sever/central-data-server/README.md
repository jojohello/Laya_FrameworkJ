# Central Data Server

Central Data Server is the shared authority for accounts, login sessions, Gateway allocation, and Gateway/Game Server registry state.

## Run

Default port: `8083`.

```powershell
mvn -pl central-data-server spring-boot:run
```

Main API groups:

- `/api/v1/users`
- `/api/v1/sessions`
- `/api/v1/gateway`
- `/api/v1/game-server`
- Native WebSocket: `/ws/native`
- Actuator health: `/actuator/health`
- OpenAPI UI: `/swagger-ui.html`

The checked-in default profile currently uses Redis-backed repositories and simple Spring cache in places; database behavior varies by profile. Read `application.yml` before assuming MySQL is active.
