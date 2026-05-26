import { K8sCoreV1Api } from "./config.js";

export const createService = async (sandBoxId) => {
  const serviceManifest = {
    metadata: {
      name: `sandbox-service-${sandBoxId}`,
      labels: {
        sandbox: sandBoxId,
      },
    },
    spec: {
      selector: {
        sandbox: sandBoxId,
      },
      ports: [
        {
          name: "http",
          port: 80,
          targetPort: 5173,
          protocal: "TCP",
        },
        {
          name: "agent-http",
          port: 3000,
          targetPort: 3000,
          protocal: "TCP",
        },
      ],
      type: "ClusterIP",
    },
  };

  const response = await K8sCoreV1Api.createNamespacedService({
    namespace: "default",
    body: serviceManifest,
  });

  return response;
};

export const deleteService = async (sandBoxId) => {
  const response = await K8sCoreV1Api.deleteNamespacedService(
{   namespace:"default",
    name:`sandbox-service-${sandBoxId}`})
  
  return response;
};