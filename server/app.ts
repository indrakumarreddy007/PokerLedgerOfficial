import express from 'express';
import cors from 'cors';

// Import handlers manually instead of dynamic import for easier serverless bundling
import { handler as loginHandler } from './auth/login.js';
import { handler as registerHandler } from './auth/register.js';
import { handler as buyinIdHandler } from './buyin/[id].js';
import { handler as sessionBuyinHandler } from './session/buyin.js';
import { handler as sessionJoinHandler } from './session/join.js';
import { handler as sessionSettleHandler } from './session/settle.js';
import { handler as sessionStatusHandler } from './session/status.js';
import { handler as sessionIdHandler } from './session/[id].js';
import { handler as sessionsHandler } from './sessions.js';
import { handler as statsUserIdHandler } from './stats/[userId].js';
import { handler as healthHandler } from './health.js';

const app = express();

app.use(cors());
app.use(express.json());

// Helper middleware to merge params into query so that existing code expects req.query.[id]
const mergeParamsToQuery = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.query = { ...req.query, ...req.params };
    next();
};

import { handler as dbDebugHandler } from './db-debug.js';

app.all('/api/health', healthHandler);
app.all('/api/db-debug', dbDebugHandler);
app.all('/api/sessions', sessionsHandler);
app.all('/api/auth/login', loginHandler);
app.all('/api/auth/register', registerHandler);

app.all('/api/buyin/:id', mergeParamsToQuery, buyinIdHandler);

app.all('/api/session/buyin', sessionBuyinHandler);
app.all('/api/session/join', sessionJoinHandler);
app.all('/api/session/settle', sessionSettleHandler);
app.all('/api/session/status', sessionStatusHandler);
app.all('/api/session/:id', mergeParamsToQuery, sessionIdHandler);

app.all('/api/stats/:userId', mergeParamsToQuery, statsUserIdHandler);

export default app;
