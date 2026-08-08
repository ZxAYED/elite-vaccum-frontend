# AI Roadmap

## Natural Integration Points

### Phase 3-4

- Chat concierge UI on marketing and authenticated service pages
- Streaming troubleshooting guidance
- Tool-calling for:
  - product lookup
  - service lookup
  - availability lookup
  - order/booking status
  - draft service request creation

### Phase 5-7

- Embeddings + RAG over:
  - vacuum manuals
  - troubleshooting guides
  - warranty/policy docs
  - installation instructions

### Phase 8-10

- Multi-step orchestration for quote recommendation, troubleshooting triage, and booking assistance

### Phase 11-12

- Eval coverage for:
  - safe recommendations
  - correct service routing
  - grounded citations
  - refusal on sensitive actions without confirmation

## Frontend Preparation Needed First

- File upload components for service evidence
- Clear typed models for products, services, quotes, and bookings
- Notification surfaces for AI-assisted drafts and confirmations
- UI states for streaming, sources/citations, and human confirmation

## Guardrails

- AI suggestions must remain advisory
- Booking/payment/order mutations must require explicit user confirmation and backend validation
