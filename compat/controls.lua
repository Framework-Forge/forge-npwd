-- This old local event is an API alias, not a second control/phone implementation.
AddEventHandler('npwd:disableControlActions', function(disabled)
    TriggerEvent('forge-npwd:disableControlActions', disabled)
end)
