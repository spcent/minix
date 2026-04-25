import { z } from "zod";

import { apiPaginationQueryShape } from "../schema-helpers";

export const itemsQuerySchema = z.object({
  ...apiPaginationQueryShape,
});
