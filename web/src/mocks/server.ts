import { setupServer } from 'msw/node';

/** Tests start with no bridge (connections fail) and add handlers per scenario. */
export const server = setupServer();
