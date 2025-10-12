import { AIMessage, Message, ToolMessage } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useStreamContext } from "@/providers/Stream";
import { v4 as uuidv4 } from "uuid";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
// Property UI and helpers (inlined to avoid extra module/type issues)
interface Property {
  id: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  price?: number | string;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  areaSqm?: number;
  propertyType?: string;
  yearBuilt?: number;
  description?: string;
  features?: string[];
  imageUrl?: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
  listingUrl?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
}

function isPropertyLike(value: any): value is Property {
  if (!value || typeof value !== "object") return false;
  return (
    "id" in value || "address" in value || "title" in value || "price" in value
  );
}

function normalizeProperty(item: any, index: number): Property {
  const id = String(item.id ?? item.listingId ?? item.mlsId ?? index);
  const price = item.price ?? item.listPrice ?? item.askingPrice ?? item.rent;
  const imageUrl = item.imageUrl ?? item.thumbnail ?? item.image ?? item.images?.[0];

  return {
    id,
    title: item.title ?? item.name ?? item.headline,
    address: item.address ?? item.location ?? item.streetAddress,
    city: item.city,
    state: item.state ?? item.region,
    postalCode: item.postalCode ?? item.zip,
    price,
    currency: item.currency,
    bedrooms: item.bedrooms ?? item.beds,
    bathrooms: item.bathrooms ?? item.baths,
    areaSqft: item.areaSqft ?? item.sqft ?? item.squareFeet,
    areaSqm: item.areaSqm ?? item.squareMeters,
    propertyType: item.propertyType ?? item.type,
    yearBuilt: item.yearBuilt,
    description: item.description,
    features: item.features,
    imageUrl,
    imageUrls: item.imageUrls ?? item.images,
    thumbnailUrl: item.thumbnailUrl ?? item.thumbnail,
    listingUrl: item.listingUrl ?? item.url,
    agentName: item.agentName,
    agentPhone: item.agentPhone,
    agentEmail: item.agentEmail,
  };
}

function formatPrice(price?: number | string, currency?: string): string {
  if (price === undefined || price === null || price === "") return "-";
  try {
    const value = typeof price === "string" ? Number(price) : price;
    if (Number.isFinite(value)) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 0,
      }).format(value as number);
    }
  } catch {
    return String(price);
  }
  return String(price);
}

function PropertyCard({
  property,
  onScheduleViewing,
  onRequestInfo,
}: {
  property: Property;
  onScheduleViewing?: (property: Property) => void;
  onRequestInfo?: (property: Property) => void;
}) {
  const {
    title,
    address,
    city,
    state,
    postalCode,
    price,
    currency,
    bedrooms,
    bathrooms,
    areaSqft,
    areaSqm,
    propertyType,
    imageUrl,
    thumbnailUrl,
    imageUrls,
    listingUrl,
  } = property;

  const primaryImage = imageUrl || thumbnailUrl || imageUrls?.[0];
  const subtitle = [address, [city, state].filter(Boolean).join(", "), postalCode]
    .filter(Boolean)
    .join(" · ");
  const areaText =
    areaSqft ? `${areaSqft?.toLocaleString?.() ?? areaSqft} sqft` : areaSqm ? `${areaSqm?.toLocaleString?.() ?? areaSqm} sqm` : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {primaryImage ? (
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          <img
            src={primaryImage}
            alt={title || address || "Property"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {title || address || "Property"}
            </h3>
            {subtitle && (
              <p className="truncate text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-base font-semibold text-gray-900">
              {formatPrice(price, currency)}
            </div>
            {propertyType && (
              <div className="text-xs text-gray-500">{propertyType}</div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
          {typeof bedrooms === "number" && <span>{bedrooms} bed</span>}
          {typeof bathrooms === "number" && <span>{bathrooms} bath</span>}
          {areaText && <span>{areaText}</span>}
        </div>

        <div className="mt-2 flex items-center gap-2">
          {onScheduleViewing && (
            <button
              className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] h-9 px-4 py-2"
              onClick={() => onScheduleViewing(property)}
            >
              Schedule viewing
            </button>
          )}
          {onRequestInfo && (
            <button
              className="border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] h-9 px-4 py-2"
              onClick={() => onRequestInfo(property)}
            >
              Request info
            </button>
          )}
          {listingUrl && (
            <a
              href={listingUrl}
              target="_blank"
              className="ml-auto text-sm text-blue-600 hover:underline"
            >
              View listing
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyGrid({
  properties,
  onScheduleViewing,
  onRequestInfo,
}: {
  properties: Property[];
  onScheduleViewing?: (property: Property) => void;
  onRequestInfo?: (property: Property) => void;
}) {
  if (!properties?.length) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p) => (
        <PropertyCard
          key={p.id}
          property={p}
          onScheduleViewing={onScheduleViewing}
          onRequestInfo={onRequestInfo}
        />
      ))}
    </div>
  );
}

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        const hasArgs = Object.keys(args).length > 0;
        return (
          <div
            key={idx}
            className="overflow-hidden rounded-lg border border-gray-200"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
              <h3 className="font-medium text-gray-900">
                {tc.name}
                {tc.id && (
                  <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                    {tc.id}
                  </code>
                )}
              </h3>
            </div>
            {hasArgs ? (
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(args).map(([key, value], argIdx) => (
                    <tr key={argIdx}>
                      <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                        {key}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {isComplexValue(value) ? (
                          <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
                            {JSON.stringify(value, null, 2)}
                          </code>
                        ) : (
                          String(value)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <code className="block p-3 text-sm">{"{}"}</code>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const thread = useStreamContext();

  let parsedContent: any;
  let isJsonContent = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
      isJsonContent = isComplexValue(parsedContent);
    }
  } catch {
    // Content is not JSON, use as is
    parsedContent = message.content;
  }

  const contentStr = isJsonContent
    ? JSON.stringify(parsedContent, null, 2)
    : String(message.content);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;
  const displayedContent =
    shouldTruncate && !isExpanded
      ? contentStr.length > 500
        ? contentStr.slice(0, 500) + "..."
        : contentLines.slice(0, 4).join("\n") + "\n..."
      : contentStr;

  function sendHumanMessage(text: string, context?: Record<string, unknown>) {
    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [{ type: "text", text }],
    };
    const toolMessages = ensureToolCallsHaveResponses(thread.messages);
    thread.submit(
      { messages: [...toolMessages, newHumanMessage], context },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
          context,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );
  }

  function handleScheduleViewing(property: Property) {
    const address =
      property.title ||
      [property.address, property.city, property.state, property.postalCode]
        .filter(Boolean)
        .join(", ");
    const text = `Please schedule a viewing for this property.\nPropertyID: ${property.id}\nAddress: ${address}`;
    sendHumanMessage(text, { action: "schedule_viewing", property });
  }

  function handleRequestInfo(property: Property) {
    const address =
      property.title ||
      [property.address, property.city, property.state, property.postalCode]
        .filter(Boolean)
        .join(", ");
    const text = `I'd like more information about this property.\nPropertyID: ${property.id}\nAddress: ${address}`;
    sendHumanMessage(text, { action: "request_info", property });
  }

  function extractPropertyList(data: any): Property[] | null {
    try {
      if (!data) return null;
      if (Array.isArray(data) && data.some((x) => isPropertyLike(x))) {
        return data.map((x, i) => normalizeProperty(x, i));
      }
      if (typeof data === "object") {
        const candidates = [data.properties, data.listings, data.results];
        for (const arr of candidates) {
          if (Array.isArray(arr) && arr.some((x) => isPropertyLike(x))) {
            return arr.map((x: any, i: number) => normalizeProperty(x, i));
          }
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  function extractSingleProperty(data: any): Property | null {
    if (data && typeof data === "object" && isPropertyLike(data)) {
      return normalizeProperty(data, 0);
    }
    return null;
  }

  return (
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {message.name ? (
              <h3 className="font-medium text-gray-900">
                Tool Result:{" "}
                <code className="rounded bg-gray-100 px-2 py-1">
                  {message.name}
                </code>
              </h3>
            ) : (
              <h3 className="font-medium text-gray-900">Tool Result</h3>
            )}
            {message.tool_call_id && (
              <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                {message.tool_call_id}
              </code>
            )}
          </div>
        </div>
        <motion.div
          className="min-w-full bg-gray-100"
          initial={false}
          animate={{ height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-3">
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              <motion.div
                key={isExpanded ? "expanded" : "collapsed"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {isJsonContent ? (
                  (() => {
                    const list = extractPropertyList(parsedContent);
                    if (list && list.length) {
                      return (
                        <PropertyGrid
                          properties={isExpanded ? list : list.slice(0, 6)}
                          onScheduleViewing={handleScheduleViewing}
                          onRequestInfo={handleRequestInfo}
                        />
                      );
                    }
                    const single = extractSingleProperty(parsedContent);
                    if (single) {
                      return (
                        <PropertyCard
                          property={single}
                          onScheduleViewing={handleScheduleViewing}
                          onRequestInfo={handleRequestInfo}
                        />
                      );
                    }
                    return (
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="divide-y divide-gray-200">
                          {(Array.isArray(parsedContent)
                            ? isExpanded
                              ? parsedContent
                              : parsedContent.slice(0, 5)
                            : Object.entries(parsedContent)
                          ).map((item, argIdx) => {
                            const [key, value] = Array.isArray(parsedContent)
                              ? [argIdx, item]
                              : [item[0], item[1]];
                            return (
                              <tr key={argIdx}>
                                <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                                  {key}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {isComplexValue(value) ? (
                                    <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
                                      {JSON.stringify(value, null, 2)}
                                    </code>
                                  ) : (
                                    String(value)
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()
                ) : (
                  <code className="block text-sm">{displayedContent}</code>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          {((shouldTruncate && !isJsonContent) ||
            (isJsonContent &&
              ((Array.isArray(parsedContent) && parsedContent.length > 5) ||
                ((extractPropertyList(parsedContent)?.length ?? 0) > 6)))) && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full cursor-pointer items-center justify-center border-t-[1px] border-gray-200 py-2 text-gray-500 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-600"
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
