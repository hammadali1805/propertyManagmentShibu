
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = process.env.PORT || 3000;

  // In-memory store for chat messages (for demo purposes)
  const chatMessages: any[] = [];

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_property", (propertyId) => {
      socket.join(propertyId);
      console.log(`User ${socket.id} joined property room: ${propertyId}`);
      
      // Send existing messages for this property
      const propertyMessages = chatMessages.filter(m => m.propertyId === propertyId);
      socket.emit("chat_history", propertyMessages);
    });

    socket.on("send_message", (message) => {
      const newMessage = {
        ...message,
        id: `msg-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      chatMessages.push(newMessage);
      io.to(message.propertyId).emit("new_message", newMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("/{*path}", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
