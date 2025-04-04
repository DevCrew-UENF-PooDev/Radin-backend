import express from 'express';
import http from 'http';
// import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { expressjwt } from 'express-jwt';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import messageRoutes from './routes/message';

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

server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});