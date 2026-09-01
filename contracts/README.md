# contracts

Foundry workspace for Masayume's own contracts: `Waitlist` (Epic 4), `EventVault` (Epic 6), `ParlayReserve` (Epic 7).

Deploys write a generated addresses module consumed only by `packages/markets`; deploy order is lockstep — deploy contracts → commit the regenerated module → deploy ops + web from that commit (AD-10).

Contracts store and emit only the venue's canonical on-chain market identifier, never a pool address.
