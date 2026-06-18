using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartBudget.Migrations
{
    /// <inheritdoc />
    public partial class AddSavingsGoals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                table: "SavingsGoals",
                newName: "IsCompleted");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "SavingsGoals",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<DateTime>(
                name: "TargetDate",
                table: "SavingsGoals",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "TEXT");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_Type",
                table: "Transactions",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_SavingsGoals_UserId_IsCompleted",
                table: "SavingsGoals",
                columns: new[] { "UserId", "IsCompleted" });

            migrationBuilder.AddForeignKey(
                name: "FK_SavingsGoals_AspNetUsers_UserId",
                table: "SavingsGoals",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SavingsGoals_AspNetUsers_UserId",
                table: "SavingsGoals");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_Type",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_SavingsGoals_UserId_IsCompleted",
                table: "SavingsGoals");

            migrationBuilder.RenameColumn(
                name: "IsCompleted",
                table: "SavingsGoals",
                newName: "Status");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "SavingsGoals",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "TargetDate",
                table: "SavingsGoals",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "TEXT",
                oldNullable: true);
        }
    }
}
