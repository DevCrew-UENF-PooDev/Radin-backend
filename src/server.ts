import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { expressjwt } from 'express-jwt';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import groupRoutes from './routes/groups.route';
import chatRoutes from './routes/chats.route';
import { initSocket } from './sockets';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const origin = process.env.ORIGIN || 'http://localhost:9000';
const server = http.createServer(app);

app.use(cors({
  origin: origin,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use(
  expressjwt({
    secret: process.env.SUPABASE_JWT_SECRET!,
    algorithms: ['HS256'],
    requestProperty: 'user',
    getToken: (req) => req.cookies['access_token'],
  }).unless({
    path: ['/api/auth/login', '/api/auth/register']
  })
)

initSocket(server);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/chats', chatRoutes);

server.listen(port, () => {
  console.log(`Servidor rodando em ${origin}`);
});