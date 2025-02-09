# WETH

A NextJs implementation of a WETH contract, allowing the user to wrap and unwrap ETH into WETH.

## Overview

This implementation includes:

- Wallet signing using RainbowKit
- Safe signing using the Safe SDK (@safe-global/api-kit, @safe-global/relay-kit)

## Prerequisites

- Node.js
- Credentials for (Pimlico)[https://www.pimlico.io/]
- Credentials for (RainbowKit)[https://www.rainbowkit.com/docs/installation#configure]

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Add your credentials for Pimlico and RainbowKit to the `.env` file.

Note: This implementation has been tested on Sepolia testnet.

## Running the Server

Start the development server:

```bash
pnpm dev
```

The server runs on port 3000 by default. You can visit it on your browser at `http://localhost:3000`.
