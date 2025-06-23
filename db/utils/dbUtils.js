export const verifyDB = async (connection) => {
  const [tables] = await connection.execute(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE();
  `);

  const schema = [];
  for (const table of tables) {
    const tableName = table.TABLE_NAME;
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE();
      `,
      [tableName]
    );

    schema.push({
      table: tableName,
      description: `La tabla '${tableName}' tiene ${columns.length} columnas.`,
      columns: columns.map((col) => ({
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE,
        nullable: col.IS_NULLABLE === "YES",
        key: col.COLUMN_KEY,
        extra: col.EXTRA,
      })),
    });
  }

  return schema;
};
