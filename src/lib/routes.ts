export const PROPERTIES_ANCHOR = "/#properties"

/** Full listing of all properties, with filters kept in the URL. */
export const PROPERTIES_PAGE = "/properties"

/**
 * Menu links that cover several consecutive home sections: a link to the key
 * section stays highlighted until the end of the value section.
 * Partners → rewards → testimonials together form the "clients" area.
 */
export const SECTION_SPANS: Record<string, string> = {
  partners: "testimonials",
}

export const projectHref = (slug: string) => `${PROPERTIES_PAGE}/${slug}`
