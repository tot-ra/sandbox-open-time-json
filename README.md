# sandbox-open-time-json


## Installation & Usage
```sh
nvm use
npm i
npm run build
docker-compose up


curl -X POST -H "Content-Type: application/json" -d '{"monday": [{"type": "open", "value": 32400},{"type": "close","value": 37800}]}' http://localhost:1234/availability
```

## Architecture

```mermaid
flowchart LR
    client --"POST /availability\nJSON" --> sandbox-open-time-json("sandbox-open-time-json\n0.0.0.0:1234")
```

## Development

### Natively
```
npm run dev
```

## Testing
```
npm run test
```
