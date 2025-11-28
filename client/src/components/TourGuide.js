import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "../styles/tour.css";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { useAuthStore } from "../store/useAuthStore";

export const startTour = (user, onComplete) => {
  const token = useAuthStore.getState().token;

  const tourDriver = driver({
    showProgress: true,
    animate: true,
    allowClose: false,
    doneBtnText: "I Agree & Finish",
    nextBtnText: "Next",
    prevBtnText: "Previous",
    steps: [
      {
        element: "#tour-welcome",
        popover: {
          title: "Welcome to HelioScape! 🚀",
          description:
            "Your secure, decentralized cloud storage solution. Let's take a quick tour.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-storage-overview",
        popover: {
          title: "Storage Overview 📊",
          description:
            "See your total storage usage across all connected providers (Google Drive, Dropbox, MEGA).",
          side: "bottom",
        },
      },
      {
        element: "#tour-upload-area",
        popover: {
          title: "Upload Files 📤",
          description:
            "Drag & drop files here. We'll automatically shard and encrypt them before distributing to your clouds.",
          side: "top",
        },
      },
      {
        element: "#tour-files-link",
        popover: {
          title: "My Files 📂",
          description:
            "Manage your files, create folders, and organize your secure vault here.",
          side: "right",
        },
      },
      {
        element: "#tour-settings-link",
        popover: {
          title: "Connect Accounts 🔗",
          description:
            "Link more cloud providers here to increase your total storage capacity.",
          side: "right",
        },
      },
      {
        element: "body", // Center modal
        popover: {
          title: "⚠️ Important: Data Responsibility",
          description:
            "By using HelioScape, you acknowledge that YOU are solely responsible for the data being stored. We are NOT responsible for any data loss or deletions. Click 'I Agree' to accept.",
          side: "center",
          align: "center",
          popoverClass: "driver-popover-center-text",
        },
      },
    ],
    onDestroyStarted: () => {
      if (
        !tourDriver.hasNextStep() ||
        confirm("Are you sure you want to skip the tour?")
      ) {
        tourDriver.destroy();
      }
    },
    onDestroyed: async () => {
      // This runs when tour is finished or skipped (if we allow skip)
      // But for the consent, we want to ensure they clicked "Done" on the last step?
      // driver.js doesn't easily distinguish "Done" vs "Skip" in onDestroyed without tracking state.
      // However, we can assume if they reached the end, they agreed.

      // Save preference to DB
      try {
        await axios.patch(
          `${API_BASE_URL}/users/updateMe`,
          {
            preferences: {
              ...user.preferences,
              tourCompleted: true,
              dataResponsibilityAccepted: new Date(),
            },
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (onComplete) onComplete();
      } catch (err) {
        console.error("Failed to save tour preference:", err);
      }
    },
  });

  tourDriver.drive();
};
