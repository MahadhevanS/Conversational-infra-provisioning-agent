import React from "react";

const DeploymentSuccessView = ({ data, theme }) => {
  const outputs = data?.outputs || {};

  return (
    <div className={`p-4 rounded-xl border ${
      theme === "dark"
        ? "bg-emerald-500/5 border-emerald-500/20"
        : "bg-emerald-50 border-emerald-200"
    }`}>
      
      <div className="text-emerald-500 font-bold mb-3">
        ✅ Deployment Successful
      </div>

      {Object.entries(outputs).map(([key, value]) => {
        const val = value?.value ?? value;

        const isHttpUrl =
        typeof val === "string" &&
        (val.startsWith("http://") || val.startsWith("https://"));

        const isWebsiteEndpoint =
        typeof val === "string" &&
        val.includes(".s3-website-");

        const isAlbOrPublicDns =
        typeof val === "string" &&
        val.includes("elb.amazonaws.com");

        const isUrl = isHttpUrl || isWebsiteEndpoint || isAlbOrPublicDns;

        return (
          <div
            key={key}
            className="flex justify-between items-center bg-white/5 dark:bg-black/20 px-3 py-2 rounded-lg mb-2 border border-white/10"
          >
            <span className="text-xs font-medium truncate">
              {key}
            </span>

            {isUrl ? (
              <a
                href={`http://${val}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 text-xs hover:underline"
              >
                Open
              </a>
            ) : (
              <button
                onClick={() => navigator.clipboard.writeText(val)}
                className="text-xs text-emerald-400 hover:underline"
              >
                Copy
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DeploymentSuccessView;