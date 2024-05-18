import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  CalloutCard,
  DataTable,
  Text,
  Button,
} from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { EditIcon } from "@shopify/polaris-icons";

export async function loader({ request }) {
  const { session, admin } = await authenticate.admin(request);
  const storeData = await admin.rest.resources.Shop.all({
    session: session,
  });
  return json({ storeId: storeData.data[0].id });
}

export default function Index() {
  const [products, setProducts] = useState([]);
  const { storeId } = useLoaderData();
  const headers = { "Content-Type": "application/json" };

  useEffect(() => {
    fetchReviewProducts();
  }, []);

  const fetchReviewProducts = async () => {
    fetch("https://api.autoreviewsapp.com/shopify/products", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ store_id: storeId }),
    })
      .then((response) => response.json())
      .then((data) => {
        setProducts(
          data.message.map((product) => ({
            productId: product.product_id,
            productTitle: product.product_title,
            reviewsCount: product.reviews_count,
          })),
        );
      })
      .then((data) => {
        console.log(data);
      });
  };

  const createProductReviews = async () => {
    const selected = await shopify.resourcePicker({
      type: "product",
      filter: { variants: false },
      action: "select",
    });
    if (selected) {
      const productTitle = selected[0].handle;
      const productId = selected[0].id;
      const description = selected[0].descriptionHtml;
      generateReviews(productTitle, productId, description);
    }
  };

  const generateReviews = async (productTitle, productId, description) => {
    fetch("https://api.autoreviewsapp.com/shopify/generate", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        store_id: storeId,
        product_id: productId,
        product_title: productTitle,
        description: description,
        comment_count: 1,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      });
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <CalloutCard
            title="Add new reviews to your products with AI technology"
            illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
            primaryAction={{
              content: "Add product reviews",
              onAction: createProductReviews,
            }}
          ></CalloutCard>
        </Layout.Section>
        <Layout.Section>
          <DataTable
            columnContentTypes={["text", "text", "text"]}
            headings={["Product Title", "Number of Reviews", "Action"]}
            rows={products.map((product) => [
              <Text variant="bodyMd" fontWeight="bold" as="span">
                {product.productTitle}
              </Text>,
              <Text variant="bodyMd" fontWeight="bold" as="span">
                {product.reviewsCount}
              </Text>,
              <Text>
                <Button
                  size="slim"
                  icon={EditIcon}
                  url={`/app/product/${product.productId}`}
                >
                  Edit Reviews
                </Button>
              </Text>,
            ])}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
