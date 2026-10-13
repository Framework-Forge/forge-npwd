import { SecurityEvents } from '@typings/security';
import { RegisterNuiProxy } from '../cl_utils';

RegisterNuiProxy(SecurityEvents.STATUS);
RegisterNuiProxy(SecurityEvents.SETUP_PIN);
RegisterNuiProxy(SecurityEvents.VERIFY_PIN);
RegisterNuiProxy(SecurityEvents.CHANGE_PIN);
