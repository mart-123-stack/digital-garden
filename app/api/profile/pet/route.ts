import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const PETS: Record<string, { name: string; cost: number }> = {
  fox: { name: "星尘狐狸", cost: 120 },
  whale: { name: "月光鲸", cost: 260 },
  deer: { name: "薄荷鹿", cost: 420 }
};

type PetRow = {
  species: string;
  name: string;
  level: number;
  xp: number;
  owned_species: string[] | null;
};

async function ensurePet(userId: string) {
  await query(
    `INSERT INTO pets (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

async function getBalance(userId: string) {
  const result = await query<{ total: string }>(
    `SELECT COALESCE(SUM(points), 0)::text AS total
     FROM star_points_ledger
     WHERE user_id = $1`,
    [userId]
  );

  return Number(result.rows[0]?.total || 0);
}

async function getPet(userId: string) {
  const result = await query<PetRow>(
    `SELECT species, name, level, xp, owned_species
     FROM pets
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0];
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const species = typeof body.species === "string" ? body.species : "";
    const action = body.action === "select" ? "select" : "buy";
    const petConfig = PETS[species];

    if (!petConfig) {
      return NextResponse.json({ error: "Unknown pet species" }, { status: 400 });
    }

    const userId = auth.user!.id;
    await ensurePet(userId);

    const current = await getPet(userId);
    const owned = Array.isArray(current?.owned_species) ? current.owned_species : [];

    if (action === "select") {
      if (!owned.includes(species)) {
        return NextResponse.json({ error: "Pet not owned" }, { status: 403 });
      }

      const updated = await query<PetRow>(
        `UPDATE pets
         SET species = $2,
             name = $3,
             updated_at = NOW()
         WHERE user_id = $1
         RETURNING species, name, level, xp, owned_species`,
        [userId, species, petConfig.name]
      );

      return NextResponse.json({ pet: updated.rows[0], balance: await getBalance(userId) });
    }

    if (owned.includes(species)) {
      return NextResponse.json({ error: "Pet already owned" }, { status: 409 });
    }

    const balance = await getBalance(userId);
    if (balance < petConfig.cost) {
      return NextResponse.json({ error: "Not enough star points", balance }, { status: 402 });
    }

    await query(
      `INSERT INTO star_points_ledger (user_id, action, points, source_id)
       VALUES ($1, 'pet_purchase', $2, $3)`,
      [userId, -petConfig.cost, species]
    );

    const updated = await query<PetRow>(
      `UPDATE pets
       SET species = $2,
           name = $3,
           owned_species = owned_species || jsonb_build_array($4::text),
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING species, name, level, xp, owned_species`,
      [userId, species, petConfig.name, species]
    );

    return NextResponse.json({ pet: updated.rows[0], balance: balance - petConfig.cost });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update pet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
