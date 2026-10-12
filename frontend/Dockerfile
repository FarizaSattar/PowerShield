FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_POWERSHIELD_API
ENV VITE_POWERSHIELD_API=$VITE_POWERSHIELD_API
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
