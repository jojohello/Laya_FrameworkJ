# Common

Shared code used by multiple server modules. The current public utility is `SensitiveDataMasker`, which masks tokens and other sensitive values before logging.

Build through the parent reactor or directly:

```powershell
mvn -pl common test
```
