# Real-Time Paper Trading on Azure

## Overview
Building a real-time paper trading web application. This project enables users to stream live market data and retain historical records using Azure, providing a low-cost, easy-to-use platform for realistic trading strategy simulations.

## Problem Statement
Many aspiring traders rely on paper trading platforms to practice investing without financial risk. However, existing platforms have several limitations:
- **Limited Customization**: Lack of flexibility for users to tailor their trading experience, making it difficult to simulate real-world strategies effectively.
- **Clustered Interface**: Overwhelming dashboards that make navigation difficult, especially for beginners.
- **Delayed Market Data**: Some platforms fail to provide real-time updates, leading to inaccurate simulations that do not reflect actual trading conditions.

These issues result in an ineffective and unrealistic trading experience, reducing the educational value of paper trading.

## Our Solution
Compared to existing paper trading platforms, our solution offers:
- A more **appealing and easy-to-use** interface.
- **Real-time data updates** for more accurate simulations.

## Project Goals & Expected Outcomes
- **Live Simulation**: Paper trading that mirrors real-time market conditions for the top 10 companies.
- **Real-Time Updates**: Market data updates every 5 seconds.
- **Historical Data**: Efficient storage and management of 5 years of market data.
- **Cost Efficiency**: Utilization of Azure student credits with a serverless architecture.

## Approach & Resources
1. **Frontend**: React/JavaScript for an intuitive UI.
2. **Storage**: Azure Data Lake Gen2 / SQL Database for historical data retention.
3. **Processing**: Serverless Spark / Spark on Databricks for efficient data processing.
4. **Streaming Layer**: Azure Event Hubs (Kafka) for real-time data ingestion.
5. **Data Ingestion**: Coinbase WebSocket for live market data.

### System Architecture
- Data ingestion from **Coinbase WebSocket**.
- Real-time data processing using **Azure Event Hubs & Serverless Spark**.
- Historical data stored in **Azure Data Lake Gen2**.
- User-friendly interface built with **React/JavaScript**.

## Project Timeline & Milestones

| Phase | Duration | Tasks |
|--------|------------|----------------------------------------|
| **Phase 1** | Weeks 1-2 | Gather requirements, design architecture, and proof-of-concept for data ingestion. |
| **Phase 2** | Weeks 3-4 | Set up Azure Event Hubs and serverless Spark streaming jobs. Test data flow. |
| **Phase 3** | Weeks 5-6 | Integrate Azure Data Lake. Build API/UI components. |
| **Phase 4** | Week 7 | Final testing, optimization, deployment, and documentation. |

## Conclusion
This project aims to deliver a high-performance, real-time paper trading platform leveraging Azure's cloud capabilities. By addressing key limitations in existing platforms, we provide a more engaging and accurate trading experience.

