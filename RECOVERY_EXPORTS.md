# Forge NPWD - Exports de recuperacao

Todos os exports sao de servidor e recebem o `source` do jogador. O Forge NPWD resolve o `citizenid` internamente; o script chamador nao informa nem controla o proprietario.

Como as operacoes consultam banco e inventario, os exemplos Lua usam callback.

## Emitir aparelho novo

```lua
exports['forge-npwd']:issueNewPhone(source, 'forge_one', 'black', function(result)
    if not result.success then
        print(('Falha ao emitir: %s'):format(result.error))
        return
    end

    print(('Aparelho %s | Numero %s'):format(result.newDeviceId, result.phoneNumber))
end)
```

O modelo e a cor sao validados pelo Forge NPWD. O aparelho ja e entregue com `device_id`, perfil, linha e numero registrados.

## Listar aparelhos do proprietario

```lua
exports['forge-npwd']:getOwnedPhoneDevices(source, function(devices)
    for _, device in ipairs(devices) do
        print(device.deviceId, device.phoneNumber, device.status)
    end
end)
```

Cada registro possui:

- `deviceId`
- `serialNumber`
- `phoneNumber`
- `model`
- `color`
- `status`: `active`, `blocked` ou `replaced`
- `currentUserCitizenId`
- `replacedByDeviceId`

## Cancelar aparelho perdido

```lua
exports['forge-npwd']:cancelLostPhone(source, deviceId, function(result)
    if not result.success then
        print(('Falha ao cancelar: %s'):format(result.error))
        return
    end

    print(('Aparelho %s bloqueado.'):format(result.oldDeviceId))
end)
```

O cancelamento:

- valida que o jogador e o proprietario registrado;
- muda o aparelho para `blocked`;
- remove o usuario atual;
- revoga sessoes abertas;
- impede o item antigo de abrir o telefone.

## Emitir aparelho substituto

O aparelho antigo precisa estar `blocked`. O slot e opcional.

```lua
exports['forge-npwd']:issueReplacementPhone(source, oldDeviceId, function(result)
    if not result.success then
        print(('Falha ao recuperar: %s'):format(result.error))
        return
    end

    print(('Novo aparelho: %s | Numero: %s'):format(result.newDeviceId, result.phoneNumber))
end)
```

Com slot preferencial:

```lua
exports['forge-npwd']:issueReplacementPhone(source, oldDeviceId, 5, function(result)
    print(json.encode(result))
end)
```

A substituicao:

- cria outro `device_id` e numero de serie;
- adiciona um novo item `phone` pelo `pr_bridge`;
- preserva `profile_id`, `line_id` e numero telefonico;
- preserva configuracoes, paginas da home e dados ligados ao perfil;
- copia hash, salt e tamanho do PIN para o novo aparelho;
- redefine tentativas e bloqueio temporario do PIN;
- muda o aparelho antigo para `replaced`;
- grava o novo aparelho em `replaced_by_device_id`.

## Erros esperados

- `PLAYER_NOT_LOADED`
- `INVALID_DEVICE_ID`
- `DEVICE_NOT_FOUND_OR_NOT_OWNED`
- `DEVICE_MUST_BE_BLOCKED`
- `DEVICE_ALREADY_REPLACED`
- `INVENTORY_FULL`
- `INVENTORY_ADD_FAILED`
- `PHONE_NUMBER_GENERATION_FAILED`
- `INTERNAL_ERROR`
