import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRoomEntity1770055292605 implements MigrationInterface {
    name = 'UpdateRoomEntity1770055292605'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "room_players" ("room_id" uuid NOT NULL, "user_id" uuid NOT NULL, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "ux_room_player" UNIQUE ("room_id", "user_id"), CONSTRAINT "PK_ae44a0f25fbb672267262ae5b98" PRIMARY KEY ("room_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "ix_room_players_room" ON "room_players" ("room_id") `);
        await queryRunner.query(`ALTER TABLE "game_players" ADD CONSTRAINT "ux_game_player" UNIQUE ("game_id", "user_id")`);
        await queryRunner.query(`ALTER TABLE "room_players" ADD CONSTRAINT "FK_969851ff175224dad99e6192c2f" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_players" ADD CONSTRAINT "FK_c152da3ec3120b58336e85f023b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "room_players" DROP CONSTRAINT "FK_c152da3ec3120b58336e85f023b"`);
        await queryRunner.query(`ALTER TABLE "room_players" DROP CONSTRAINT "FK_969851ff175224dad99e6192c2f"`);
        await queryRunner.query(`ALTER TABLE "game_players" DROP CONSTRAINT "ux_game_player"`);
        await queryRunner.query(`DROP INDEX "public"."ix_room_players_room"`);
        await queryRunner.query(`DROP TABLE "room_players"`);
    }

}
