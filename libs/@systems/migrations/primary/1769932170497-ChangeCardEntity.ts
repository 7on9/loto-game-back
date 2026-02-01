import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeCardEntity1769932170497 implements MigrationInterface {
    name = 'ChangeCardEntity1769932170497'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ix_cards_pair_id"`);
        await queryRunner.query(`ALTER TABLE "cards" DROP COLUMN "pair_id"`);
        await queryRunner.query(`ALTER TABLE "cards" ADD "pair_id" character varying(15) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "ix_cards_pair_id" ON "cards" ("pair_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ix_cards_pair_id"`);
        await queryRunner.query(`ALTER TABLE "cards" DROP COLUMN "pair_id"`);
        await queryRunner.query(`ALTER TABLE "cards" ADD "pair_id" character varying(10) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "ix_cards_pair_id" ON "cards" ("pair_id") `);
    }

}
