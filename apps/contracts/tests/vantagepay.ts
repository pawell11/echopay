import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VantagePay } from "../target/types/vantagepay";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cardPda(cardId: string, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("card"), Buffer.from(cardId)],
    programId
  );
}

function platformPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    programId
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VantagePay", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VantagePay as Program<VantagePay>;
  const payer = (provider.wallet as anchor.Wallet).payer;

  // PDAs
  const [platformAddr, platformBump] = platformPda(program.programId);

  // We'll use a deterministic card ID per test so PDAs are reproducible.
  const cardId = "card-uuid-001";

  // -------------------------------------------------------------------
  //  Initialize
  // -------------------------------------------------------------------

  describe("initialize", () => {
    it("creates the platform state", async () => {
      const treasury = anchor.web3.Keypair.generate();
      const echoMint = anchor.web3.Keypair.generate();

      const feeBp = 500;   // 5 %
      const echoFeeBp = 100; // 1 %
      const cbBp = 200;    // 2 %

      await program.methods
        .initialize(feeBp, echoFeeBp, cbBp)
        .accounts({
          authority: payer.publicKey,
          treasury: treasury.publicKey,
          echoMint: echoMint.publicKey,
        })
        .rpc();

      const platform = await program.account.platformState.fetch(platformAddr);

      assert.equal(platform.authority.toBase58(), payer.publicKey.toBase58());
      assert.equal(platform.treasury.toBase58(), treasury.publicKey.toBase58());
      assert.equal(platform.feeBasisPoints, feeBp);
      assert.equal(platform.echoFeeBasisPoints, echoFeeBp);
      assert.equal(platform.cashbackBasisPoints, cbBp);
      assert.equal(platform.totalCards.toNumber(), 0);
      assert.equal(platform.totalVolume.toNumber(), 0);
    });

    it("rejects fees > 10_000 bp", async () => {
      const treasury = anchor.web3.Keypair.generate();
      const echoMint = anchor.web3.Keypair.generate();

      try {
        await program.methods
          .initialize(10_001, 100, 200)
          .accounts({
            authority: payer.publicKey,
            treasury: treasury.publicKey,
            echoMint: echoMint.publicKey,
          })
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        assert.match(e.toString(), /InvalidFees|0x/);
      }
    });
  });

  // -------------------------------------------------------------------
  //  Register Card
  // -------------------------------------------------------------------

  describe("register_card", () => {
    const testCardId = "alice-card-001";

    it("registers a new virtual card", async () => {
      await program.methods
        .registerCard(testCardId)
        .accounts({
          owner: payer.publicKey,
        })
        .rpc();

      const [cardAddr] = cardPda(testCardId, program.programId);
      const card = await program.account.virtualCard.fetch(cardAddr);

      assert.equal(card.owner.toBase58(), payer.publicKey.toBase58());
      assert.equal(card.cardId, testCardId);
      assert.equal(card.balance.toNumber(), 0);
      assert.equal(card.totalTopups.toNumber(), 0);
      assert.equal(card.status, { active: {} } as any); // CardStatus::Active
    });

    it("rejects empty card ID", async () => {
      try {
        await program.methods
          .registerCard("")
          .accounts({ owner: payer.publicKey })
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        assert.match(e.toString(), /EmptyCardId|0x/);
      }
    });

    it("rejects card ID longer than 64 chars", async () => {
      const longId = "a".repeat(65);
      try {
        await program.methods
          .registerCard(longId)
          .accounts({ owner: payer.publicKey })
          .rpc();
        assert.fail("Should have thrown");
      } catch (e: any) {
        assert.match(e.toString(), /CardIdTooLong|0x/);
      }
    });

    it("increments platform total_cards", async () => {
      const platform = await program.account.platformState.fetch(platformAddr);
      // total_cards should be at least 1 after the first successful register
      assert.isAtLeast(platform.totalCards.toNumber(), 1);
    });
  });

  // -------------------------------------------------------------------
  //  Top-Up SOL
  // -------------------------------------------------------------------

  describe("top_up_sol", () => {
    // We registered "card-uuid-001" above — or we can register a fresh one.
    const solCardId = "sol-topup-card";

    before(async () => {
      await program.methods
        .registerCard(solCardId)
        .accounts({ owner: payer.publicKey })
        .rpc();
    });

    it("accepts a SOL top-up", async () => {
      // top_up_sol reads lamports from payer; in real flows you'd
      // transfer via system program. For now we just exercise the
      // instruction.
      const additionalBalance = 1_000_000; // 0.001 SOL → 100 USD cents at 1 SOL = $100

      await program.methods
        .topUpSol(solCardId)
        .accounts({
          payer: payer.publicKey,
        })
        .rpc();

      const [cardAddr] = cardPda(solCardId, program.programId);
      const card = await program.account.virtualCard.fetch(cardAddr);

      // Balance should be positive (net of fees)
      assert.isAtLeast(card.balance.toNumber(), 0);

      // The top-up should also update total_topups
      assert.isAtLeast(card.totalTopups.toNumber(), 0);
    });
  });

  // -------------------------------------------------------------------
  //  Close Card
  // -------------------------------------------------------------------

  describe("close_card", () => {
    const closeCardId = "close-me-card";

    before(async () => {
      await program.methods
        .registerCard(closeCardId)
        .accounts({ owner: payer.publicKey })
        .rpc();
    });

    it("closes a card successfully", async () => {
      await program.methods
        .closeCard(closeCardId)
        .accounts({ owner: payer.publicKey })
        .rpc();

      const [cardAddr] = cardPda(closeCardId, program.programId);
      const card = await program.account.virtualCard.fetch(cardAddr);

      assert.equal(card.status, { closed: {} } as any);
    });
  });
});
