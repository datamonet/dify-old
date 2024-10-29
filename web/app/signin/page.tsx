"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "../components/base/loading";
import style from "./page.module.css";
import cn from "@/utils/classnames";
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

  return <></>;
};

export default SignIn;
