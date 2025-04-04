import express from 'express';
import http from 'http';
// import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { expressjwt } from 'express-jwt';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import messageRoutes from './routes/message.routes';
import userRoutes from './routes/users.routes';
import chatRoutes from './routes/chats.route';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: '*' },
// });

app.use(cors());
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

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});