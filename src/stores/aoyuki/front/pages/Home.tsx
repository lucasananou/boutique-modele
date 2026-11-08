import { HOME_MAIN } from "../html.generated";
import Page from "../Page";
import type { Catalog } from "../catalog";

export default function Home({ catalog }: { catalog: Catalog }) {
  return <Page catalog={catalog} html={HOME_MAIN} />;
}
