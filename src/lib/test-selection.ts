export type TestOption = {
  id: string;
  filename: string;
  uploaded_at: string;
};

export const ALL_TIME_TEST_ID = "all";

export function getTestLabel(filename: string) {
  return filename
    .replace(/\.(xlsx|xls|csv)$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}