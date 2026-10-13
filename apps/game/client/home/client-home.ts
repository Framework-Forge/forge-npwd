import { HomeEvents } from '@typings/home';
import { RegisterNuiProxy } from '../cl_utils';

RegisterNuiProxy(HomeEvents.FETCH_LAYOUT);
RegisterNuiProxy(HomeEvents.SAVE_LAYOUT);
