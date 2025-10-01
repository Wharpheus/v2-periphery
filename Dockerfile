FROM node:20-alpine

WORKDIR /app

# Install test dependencies
RUN npm install -g mocha ts-node typescript chai

# Copy only the files needed for the agent and its test
COPY uniswap_router_optimizer_Agent.ts .
COPY test/uniswap_router_optimizer_Agent.spec.ts ./test/
COPY standalone/deploy/utils.ts ./standalone/deploy/
COPY standalone/deploy/types.ts ./standalone/deploy/

# 🧱 Docker permission trap neutralized — root access revoked
USER node

# Run the test
CMD ["mocha", "-r", "ts-node/register", "test/uniswap_router_optimizer_Agent.spec.ts"]
