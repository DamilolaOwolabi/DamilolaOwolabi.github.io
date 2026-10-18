---
layout: page
title: AI-Driven Optimization of Wind Energy Distribution in Texas
description: SMU capstone. Multi-agent reinforcement learning that coordinates wind, load, and storage agents to cut wind curtailment on the ERCOT grid.
img: assets/img/Wind_Energy_MARL/thumbnail.jpg
importance: 0
category: school
tools: [Python, Reinforcement learning, DQN, ERCOT data]
featured: true
---

<dl class="case-glance">
  <div><dt>Role</dt><dd>First author; built the simulation environment and agents</dd></div>
  <div><dt>Co-authors</dt><dd>Amer Waleed (SMU), Ogbonnaya Bassey (Aspen Technology)</dd></div>
  <div><dt>Context</dt><dd>SMU MS in Data Science capstone</dd></div>
  <div><dt>Stack</dt><dd>Python 3.13, Deep Q-Networks, ERCOT data</dd></div>
  <div><dt>Status</dt><dd>Paper in draft; quantified results in progress</dd></div>
</dl>

<a class="hero-btn hero-btn-secondary" href="{{ '/assets/pdf/Owolabi_Wind_Energy_MARL_Draft.pdf' | relative_url }}" target="_blank" rel="noopener"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i><span>Read the draft paper (PDF)</span></a>

## The problem

Texas produces more wind energy than any other state, yet much of it is **curtailed**: generated but never delivered, because West Texas transmission gets congested and ERCOT's dispatch is largely rule-based. Forecasting models (ARIMA, LSTM, VAR) predict supply and demand well, but they don't decide what the grid should _do_ in the moment.

## My approach

I framed dispatch as a **multi-agent reinforcement learning (MARL)** problem: instead of one central controller, several grid participants learn their own policies while sharing the same environment.

- **Environment.** I built a simulated wind grid in Python with three kinds of agents: wind generation, load (demand response), and **flywheel energy storage** that can soak up surplus wind during congestion.
- **Learning.** Each agent is a Deep Q-Network with its own reward signal for grid balance, curtailment, and storage operation, so agents pursue their own objectives while the system stays balanced.
- **Data.** I merged ERCOT demand, load, and wind generation data from 2014 to 2025 into one training set of **2.7 million+ records**, pulled from ERCOT's official data portal.
- **Training and testing.** Agents trained for up to 100 episodes (epsilon decaying from 1.0 to about 0.6, with early stopping) on a 4-CPU, 32 GB compute node, then were evaluated on unseen data under three stress cases: high-wind periods, peak load surges, and storage constraints.

## Results so far

- A working multi-agent environment and training pipeline on real ERCOT history.
- Agents trained and evaluated across the three stress scenarios.
- The paper's projected outcome is a 30 to 50% reduction in curtailment; that number is a target from the literature, not yet a measured result, and I'll publish measured numbers here when the analysis is complete.

## What I'd do next

- Report measured curtailment and congestion results against a rule-based baseline.
- Add ERCOT nodal prices to the reward so agents respond to market signals, as the paper proposes.
- Try policy-gradient methods (PPO) alongside DQN for continuous dispatch decisions.

## Tools

Python 3.13 · reinforcement learning (DQN) · ERCOT grid data · VS Code
