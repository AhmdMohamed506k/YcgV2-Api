# YCG - Professional Social Networking Platform

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

## 📋 Overview
**YCG** is a sophisticated, full-stack professional networking platform designed to facilitate seamless connections, knowledge sharing, and real-time interaction. The architecture emphasizes modularity, high performance, and reliability, making it a robust solution for large-scale social networking needs.

---

## 🏗 Key Features & Technical Highlights

### 🎥 Real-Time Live Streaming
- Powered by `Node Media Server` and `FFmpeg`.
- Supports professional-grade video broadcasting with low latency.
- Custom stream management logic for seamless user broadcasting.

### 💬 Interactive Communication
- **Hybrid Real-time System:** Combines `Socket.io` for instant, low-latency interactions and `Pusher` for scalable notification broadcasting.
- **Chat Engine:** Built for speed and reliability, supporting complex chat rooms and live updates.

### ⚡ Performance & Caching
- Implemented **Redis** to cache frequently accessed data, significantly reducing database load and boosting API response times.

### 🐳 Infrastructure as Code (Dockerized)
- Fully containerized using **Docker** and **Docker Compose**.
- Ensures "Build once, run anywhere" capability by abstracting environment complexities, including MongoDB and Redis services.

---

## 🛠 Technical Architecture
The platform utilizes a **Modular Design Pattern** to ensure maintainability and scalability:

*   **Modular Backend:** Encapsulated features (Users, Jobs, Chat, Activities) for clean separation of concerns.
*   **Custom Graph Data Simulation:** To overcome relational limitations in document-based storage, I implemented a custom-engineered **Graph Data Structure simulation** within MongoDB. This allows for efficient querying and handling of complex node-based relationships (such as professional networking connections), ensuring high-performance graph traversal despite the database architecture.
*   **Service-Oriented Layer:** Decoupled business logic from controllers into dedicated services (`live_stream`, `pusher`, `email`, etc.).
*   **Secure API:** Robust validation layer using `Joi` and custom security middlewares.

---

## 🚀 Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

### Setup
1. **Clone the repository:**
   ```bash
   git clone [ https://github.com/AhmdMohamed506k/YcgV2-Api ]
   cd Ycg



2. **Install dependencies:**   

* Create a .env file in the root directory. Add your essential credentials (Pusher, Cloudinary, MongoDB URI, etc.).




3. **Launch the platform:**
   ```bash
    docker-compose up --build

    

## 💡 Built By

* Ahmed Mohamed

* Full-Stack Web Developer

- **GitHub:** [ https://github.com/AhmdMohamed506k ] 
- **LinkedIn:** [ https://www.linkedin.com/in/ahmed-mohamed-1710392a5/ ]