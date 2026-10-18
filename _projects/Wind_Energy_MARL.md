---
layout: page
title: AI-Driven Optimization of Wind Energy Distribution in Texas
description: SMU capstone. Multi-agent reinforcement learning that coordinates wind, load, and storage agents to cut wind curtailment on the ERCOT grid.
img: assets/img/Wind_Energy_MARL/thumbnail.jpg
importance: 0
category: school
tools: [Python, Reinforcement learning, DQN, ERCOT data]
---

#### **Overview**

Texas produces more wind energy than any other state, yet a large share of it is curtailed because of transmission congestion and rule-based dispatch on the ERCOT grid. Forecasting models such as ARIMA, LSTM, and VAR predict supply and demand well, but they don't decide what the grid should _do_ in real time.

This capstone, co-authored with Amer Waleed and advised by Ogbonnaya Bassey (Aspen Technology), proposes a **multi-agent reinforcement learning (MARL)** framework where grid participants act as learning agents that make dispatch decisions together. I'm first author on the paper, which is currently in draft.

<a class="hero-btn hero-btn-secondary" href="{{ '/assets/pdf/Owolabi_Wind_Energy_MARL_Draft.pdf' | relative_url }}" target="_blank" rel="noopener"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i><span>Read the draft paper (PDF)</span></a>

#### **What I built**

- **A simulated wind grid environment in Python** that exposes three kinds of agents: wind generation, load (demand response), and **flywheel energy storage** that buffers surplus wind.
- **Deep Q-Network (DQN) agents** with individual reward signals for grid balance, curtailment, and storage operation, so each agent optimizes its own objective while the system stays balanced.
- **A merged training dataset of 2.7 million+ records** combining ERCOT demand, load, and wind generation data from 2014 to 2025, pulled from ERCOT's official data portal.
- **Training and evaluation**: agents trained for up to 100 episodes with epsilon decay from 1.0 to about 0.6 and early stopping, then evaluated on unseen data under high-wind periods, peak load surges, and storage constraints. Training ran on a 4-CPU, 32 GB compute node.

#### **Why it matters**

The goal is to move grid control from reactive to adaptive: agents that redirect surplus wind, use storage during congestion, and respond to ERCOT's nodal pricing, rather than wasting renewable energy that has already been generated. Quantified curtailment results are part of the ongoing work.

#### **Tools**

Python 3.13, reinforcement learning (DQN), ERCOT grid data, VS Code.
