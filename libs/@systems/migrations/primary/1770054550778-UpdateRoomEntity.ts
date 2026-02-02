import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRoomEntity1770054550778 implements MigrationInterface {
    name = 'UpdateRoomEntity1770054550778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "game_players" ("game_id" uuid NOT NULL, "user_id" uuid NOT NULL, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "ux_game_player" UNIQUE ("game_id", "user_id"), CONSTRAINT "PK_1614d9019746c797c36651748d1" PRIMARY KEY ("game_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "ix_game_players_game" ON "game_players" ("game_id") `);
        await queryRunner.query(`ALTER TABLE "rooms" ADD "code" character varying(6) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rooms" ADD CONSTRAINT "UQ_368d83b661b9670e7be1bbb9cdd" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "games" ADD "room_id" uuid`);
        await queryRunner.query(`CREATE INDEX "ix_rooms_code" ON "rooms" ("code") `);
        await queryRunner.query(`CREATE INDEX "ix_games_room" ON "games" ("room_id") `);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_26603084b8fe59af85edbf9f674" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_players" ADD CONSTRAINT "FK_67b26bf4c76bd09a206d504824b" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_players" ADD CONSTRAINT "FK_b9adcb616544097a980720bbcc6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_players" DROP CONSTRAINT "FK_b9adcb616544097a980720bbcc6"`);
        await queryRunner.query(`ALTER TABLE "game_players" DROP CONSTRAINT "FK_67b26bf4c76bd09a206d504824b"`);
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_26603084b8fe59af85edbf9f674"`);
        await queryRunner.query(`DROP INDEX "public"."ix_games_room"`);
        await queryRunner.query(`DROP INDEX "public"."ix_rooms_code"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "room_id"`);
        await queryRunner.query(`ALTER TABLE "rooms" DROP CONSTRAINT "UQ_368d83b661b9670e7be1bbb9cdd"`);
        await queryRunner.query(`ALTER TABLE "rooms" DROP COLUMN "code"`);
        await queryRunner.query(`DROP INDEX "public"."ix_game_players_game"`);
        await queryRunner.query(`DROP TABLE "game_players"`);
    }

}
