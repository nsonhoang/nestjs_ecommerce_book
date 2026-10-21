FROM node:22-alpine AS builder
    WORKDIR /app
    
    # 1. Chỉ copy file package trước để tận dụng cache
    COPY package*.json ./
    COPY prisma ./prisma/
    
    # Cài đặt toàn bộ dependencies và generate prisma client
    RUN npm ci
    RUN npx prisma generate
    
    # 2. Copy source code sau cùng
    COPY . .
    RUN npm run build
    
    # Stage 2: Production Runner (Image siêu nhẹ, chỉ chứa file cần thiết)
    FROM node:22-alpine AS runner
    WORKDIR /app
    
    ENV NODE_ENV=production
    
    COPY package*.json ./
    COPY prisma ./prisma/
    
    COPY prisma.config.ts ./

    # Chỉ cài production dependencies
    RUN npm ci --only=production && npx prisma generate
    
    # Copy kết quả build từ stage 1
    COPY --from=builder /app/dist ./dist

    
    EXPOSE 3000


    
    CMD [ "node", "dist/src/main.js" ]
