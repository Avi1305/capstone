import { K8sCoreV1Api } from "./config.js";

export const createPod = async (sandBoxId) => {
  const podManifest = {
    metadata: {
      name: `sandbox-${sandBoxId}`,
      labels: {
        sandbox: sandBoxId,
      },
    },
    spec: {
      volumes: [
        {
          name: "workspace-volume",
          emptyDir: {},
        },
      ],
      initContainers: [
        {
          name: "init-container",
          image: "template",
          imagePullPolicy: "IfNotPresent",
          command: ["sh", "-c", "cp -r /workspace/. /seed"],
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/seed",
            },
          ],
        },
      ],
      containers: [
        {
          name: "sandbox-container",
          image: "template",
          imagePullPolicy: "IfNotPresent",
          ports: [{ containerPort: 5173, name: "vite-http" }],
          resources: {
            limits: { cpu: "500m", memory: "512Mi" },
            requests: { cpu: "250m", memory: "256Mi" },
          },
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/workspace",
            },
          ],
        },
        {
          name: "agent-container",
          image: "agent",
          imagePullPolicy: "IfNotPresent",
          ports: [{ containerPort: 3000, name: "agent-http" }],
          resources: {
            limits: { cpu: "500m", memory: "1Gi" },
            requests: { cpu: "250m", memory: "500Mi" },
          },
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/workspace",
            },
          ],
        },
      ],
    },
  };

  const response = await K8sCoreV1Api.createNamespacedPod({
    namespace: "default",
    body: podManifest,
  });

  return response;
};

export const deletePod = async (sandBoxId) => {
  const response = await K8sCoreV1Api.deleteNamespacedPod(
  {
    namespace  :"default",
    name:`sandbox-${sandBoxId}`
  },
    {
      gracePeriodSeconds: 0,
    }
  );

  return response;
};
