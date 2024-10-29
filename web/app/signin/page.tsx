"use client";
import React, { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import Loading from "../components/base/loading";
import style from "./page.module.css";
import cn from "@/utils/classnames";
import { IS_CE_EDITION } from "@/config";

import type { SystemFeatures } from "@/types/feature";
import { defaultSystemFeatures } from "@/types/feature";
import { getSystemFeatures } from "@/service/common";

const SignIn = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [systemFeatures, setSystemFeatures] = useState<SystemFeatures>(
    defaultSystemFeatures
  );
  useEffect(() => {
    getSystemFeatures()
      .then((res) => {
        setSystemFeatures(res);
      })
      .finally(() => {
        router.replace(
          "https://takin.ai/auth/signin?callbackUrl=https%3A%2F%2Fdify.takin.ai%2Fapps"
        );
        setLoading(false);
      });
  }, []);

  return (
    <>
      <div
        className={cn(
          style.background,
          "flex w-full min-h-screen",
          "sm:p-4 lg:p-8",
          "gap-x-20",
          "justify-center lg:justify-start"
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col bg-white shadow rounded-2xl shrink-0",
            "space-between"
          )}
        >
          {/* <Header /> */}

          {loading && (
            <div
              className={cn(
                "flex flex-col items-center w-full grow justify-center",
                "px-6",
                "md:px-[108px]"
              )}
            >
              <Loading type="area" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SignIn;
