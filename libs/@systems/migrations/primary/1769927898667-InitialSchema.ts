import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1769927898667 implements MigrationInterface {
    name = 'InitialSchema1769927898667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "players" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "avatar" character varying, "user_id" character varying, "group_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_de22b8fdeee0c33ab55ae71da3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "creator_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rooms_status_enum" AS ENUM('waiting', 'in_progress', 'finished')`);
        await queryRunner.query(`CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "creator_id" uuid NOT NULL, "group_id" uuid, "status" "public"."rooms_status_enum" NOT NULL DEFAULT 'waiting', "game_mode" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "card_layouts" ("card_id" character varying(10) NOT NULL, "row_idx" integer NOT NULL, "col_idx" integer NOT NULL, "number" integer NOT NULL, CONSTRAINT "ux_card_number" UNIQUE ("card_id", "number"), CONSTRAINT "PK_dfb58af6888416f66ff7cf352c9" PRIMARY KEY ("card_id", "row_idx", "col_idx"))`);
        await queryRunner.query(`CREATE TABLE "cards" ("id" character varying(10) NOT NULL, "pair_id" character varying(10) NOT NULL, "color_theme" character varying(20) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5f3269634705fdff4a9935860fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_cards_active" ON "cards" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "ix_cards_pair_id" ON "cards" ("pair_id") `);
        await queryRunner.query(`CREATE TABLE "game_cards" ("game_id" uuid NOT NULL, "card_id" character varying(10) NOT NULL, "user_id" uuid NOT NULL, "selected_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b87120ff7baa0e755c171fe63fc" PRIMARY KEY ("game_id", "card_id"))`);
        await queryRunner.query(`CREATE INDEX "ix_game_cards_user" ON "game_cards" ("game_id", "user_id") `);
        await queryRunner.query(`CREATE TABLE "game_number_order" ("game_id" uuid NOT NULL, "position" integer NOT NULL, "number" integer NOT NULL, CONSTRAINT "ux_game_number_order" UNIQUE ("game_id", "number"), CONSTRAINT "PK_bc8270d8ae677d3bf8f0c951115" PRIMARY KEY ("game_id", "position"))`);
        await queryRunner.query(`CREATE TABLE "game_called_numbers" ("game_id" uuid NOT NULL, "number" integer NOT NULL, "called_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f9decdd093b63b3da03f2c47f26" PRIMARY KEY ("game_id", "number"))`);
        await queryRunner.query(`CREATE INDEX "ix_called_numbers_game" ON "game_called_numbers" ("game_id") `);
        await queryRunner.query(`CREATE TABLE "game_win_claims" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "game_id" uuid NOT NULL, "user_id" uuid NOT NULL, "card_id" character varying(10) NOT NULL, "marked_numbers" jsonb NOT NULL, "is_valid" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c5d64f7688eb44f6736e4b00b75" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_win_claims_valid" ON "game_win_claims" ("is_valid") `);
        await queryRunner.query(`CREATE INDEX "ix_win_claims_user" ON "game_win_claims" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "ix_win_claims_game" ON "game_win_claims" ("game_id") `);
        await queryRunner.query(`CREATE TABLE "game_winner_snapshot" ("game_id" uuid NOT NULL, "user_id" uuid NOT NULL, "card_id" character varying(10) NOT NULL, "called_numbers" jsonb NOT NULL, "winning_pattern" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1cf009d3de794ef65b661dd49aa" PRIMARY KEY ("game_id"))`);
        await queryRunner.query(`CREATE TABLE "games" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100), "status" character varying(20) NOT NULL DEFAULT 'PREPARE', "winner_user_id" uuid, "started_at" TIMESTAMP, "finished_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c9b16b62917b5595af982d66337" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_games_created_at" ON "games" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "ix_games_status" ON "games" ("status") `);
        await queryRunner.query(`CREATE TABLE "api_rate_limits" ("user_id" uuid NOT NULL, "endpoint" character varying(100) NOT NULL, "counter" integer NOT NULL DEFAULT '0', "window_start" TIMESTAMP NOT NULL, CONSTRAINT "PK_628dc2147f18cd99afc3fbd156e" PRIMARY KEY ("user_id", "endpoint"))`);
        await queryRunner.query(`ALTER TABLE "players" ADD CONSTRAINT "FK_6ef6494ecfce4b57b10d487b181" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "FK_33b49cd404bac777f795028c3b0" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rooms" ADD CONSTRAINT "FK_bd1f2365f91582fcdaadc7abdbe" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rooms" ADD CONSTRAINT "FK_1c190b49a6985ebb234adc9e1ea" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "card_layouts" ADD CONSTRAINT "FK_e37d120fce12840b35d3d1d6557" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_cards" ADD CONSTRAINT "FK_20449eeced3418c8d94bcf6234f" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_cards" ADD CONSTRAINT "FK_02d33faeb1e48093efe138a3ba7" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_cards" ADD CONSTRAINT "FK_993bbc8da338f15e7fac0d2c71a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_number_order" ADD CONSTRAINT "FK_5a882084d9b5378d2f3df93fec6" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_called_numbers" ADD CONSTRAINT "FK_0812f4a0ef98537c43d6cb2ff66" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_win_claims" ADD CONSTRAINT "FK_697f0b17218cf1d4f811f1c962c" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_win_claims" ADD CONSTRAINT "FK_4c9001f17aff0e206b51584775d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_win_claims" ADD CONSTRAINT "FK_2a5e89df7b8ad0fbff55a7113b7" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_winner_snapshot" ADD CONSTRAINT "FK_1cf009d3de794ef65b661dd49aa" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_winner_snapshot" ADD CONSTRAINT "FK_a0f243b890690cd1847aa78f1ca" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_63755bec799ad0ef1c6ec9fdae4" FOREIGN KEY ("winner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_63755bec799ad0ef1c6ec9fdae4"`);
        await queryRunner.query(`ALTER TABLE "game_winner_snapshot" DROP CONSTRAINT "FK_a0f243b890690cd1847aa78f1ca"`);
        await queryRunner.query(`ALTER TABLE "game_winner_snapshot" DROP CONSTRAINT "FK_1cf009d3de794ef65b661dd49aa"`);
        await queryRunner.query(`ALTER TABLE "game_win_claims" DROP CONSTRAINT "FK_2a5e89df7b8ad0fbff55a7113b7"`);
        await queryRunner.query(`ALTER TABLE "game_win_claims" DROP CONSTRAINT "FK_4c9001f17aff0e206b51584775d"`);
        await queryRunner.query(`ALTER TABLE "game_win_claims" DROP CONSTRAINT "FK_697f0b17218cf1d4f811f1c962c"`);
        await queryRunner.query(`ALTER TABLE "game_called_numbers" DROP CONSTRAINT "FK_0812f4a0ef98537c43d6cb2ff66"`);
        await queryRunner.query(`ALTER TABLE "game_number_order" DROP CONSTRAINT "FK_5a882084d9b5378d2f3df93fec6"`);
        await queryRunner.query(`ALTER TABLE "game_cards" DROP CONSTRAINT "FK_993bbc8da338f15e7fac0d2c71a"`);
        await queryRunner.query(`ALTER TABLE "game_cards" DROP CONSTRAINT "FK_02d33faeb1e48093efe138a3ba7"`);
        await queryRunner.query(`ALTER TABLE "game_cards" DROP CONSTRAINT "FK_20449eeced3418c8d94bcf6234f"`);
        await queryRunner.query(`ALTER TABLE "card_layouts" DROP CONSTRAINT "FK_e37d120fce12840b35d3d1d6557"`);
        await queryRunner.query(`ALTER TABLE "rooms" DROP CONSTRAINT "FK_1c190b49a6985ebb234adc9e1ea"`);
        await queryRunner.query(`ALTER TABLE "rooms" DROP CONSTRAINT "FK_bd1f2365f91582fcdaadc7abdbe"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "FK_33b49cd404bac777f795028c3b0"`);
        await queryRunner.query(`ALTER TABLE "players" DROP CONSTRAINT "FK_6ef6494ecfce4b57b10d487b181"`);
        await queryRunner.query(`DROP TABLE "api_rate_limits"`);
        await queryRunner.query(`DROP INDEX "public"."ix_games_status"`);
        await queryRunner.query(`DROP INDEX "public"."ix_games_created_at"`);
        await queryRunner.query(`DROP TABLE "games"`);
        await queryRunner.query(`DROP TABLE "game_winner_snapshot"`);
        await queryRunner.query(`DROP INDEX "public"."ix_win_claims_game"`);
        await queryRunner.query(`DROP INDEX "public"."ix_win_claims_user"`);
        await queryRunner.query(`DROP INDEX "public"."ix_win_claims_valid"`);
        await queryRunner.query(`DROP TABLE "game_win_claims"`);
        await queryRunner.query(`DROP INDEX "public"."ix_called_numbers_game"`);
        await queryRunner.query(`DROP TABLE "game_called_numbers"`);
        await queryRunner.query(`DROP TABLE "game_number_order"`);
        await queryRunner.query(`DROP INDEX "public"."ix_game_cards_user"`);
        await queryRunner.query(`DROP TABLE "game_cards"`);
        await queryRunner.query(`DROP INDEX "public"."ix_cards_pair_id"`);
        await queryRunner.query(`DROP INDEX "public"."ix_cards_active"`);
        await queryRunner.query(`DROP TABLE "cards"`);
        await queryRunner.query(`DROP TABLE "card_layouts"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
        await queryRunner.query(`DROP TYPE "public"."rooms_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`DROP TABLE "players"`);
    }

}
