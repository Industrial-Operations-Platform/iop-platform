# ADR-0001: Modular monolith

## Status

Accepted

## Context

IOP spans several related operational domains. Initial development needs clear ownership without the deployment and coordination cost of distributed services.

## Decision

Start with a modular monolith. Modules own their behavior and data and collaborate through explicit contracts. Web, API and worker directories represent platform hosts, not separate business services. Keep module internals private even when modules share a process or database.

## Consequences

Changes can be delivered together while boundaries remain reviewable. Boundary discipline must be verified in implementation. Separate worker execution does not imply microservices; topology and cross-module transaction/delivery mechanics remain open. Service extraction requires evidence and a new ADR.

## Alternatives considered

A single unstructured application would blur ownership. Microservices add operational complexity before scale and independent deployment needs are understood.
