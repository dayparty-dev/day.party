import { isAndroid } from '@nativescript/core';

/** Host machine from emulator/simulator (see specs quickstart: API on port 3001). */
const HOST_API = isAndroid ? 'http://10.0.2.2:3001' : 'http://127.0.0.1:3001';

/** Contract base URL includes `/api` prefix. */
export const API_BASE_URL = `${HOST_API}/api`;
