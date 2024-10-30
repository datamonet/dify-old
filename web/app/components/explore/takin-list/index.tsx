"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useContext } from "use-context-selector";
import { useDebounceFn } from "ahooks";
import { RiCloseLine } from "@remixicon/react";
import useSWRInfinite from "swr/infinite";
import { lowerCase } from "lodash-es";
import Toast from "../../base/toast";
import s from "./style.module.css";
import cn from "@/utils/classnames";
import ExploreContext from "@/context/explore-context";
import type { App } from "@/models/explore";
import Category from "@/app/components/explore/category";
import AppCard from "@/app/components/explore/app-card";
import StudioAppCard from "@/app/(commonLayout)/apps/AppCard";
import { fetchAppDetail, fetchExploreAppList } from "@/service/explore";
import { fetchAppList as appList, importApp } from "@/service/apps";
import { useTabSearchParams } from "@/hooks/use-tab-searchparams";
import CreateAppModal from "@/app/components/explore/create-app-modal";
import AppTypeSelector from "@/app/components/app/type-selector";
import type { CreateAppModalProps } from "@/app/components/explore/create-app-modal";
import Loading from "@/app/components/base/loading";
import { NEED_REFRESH_APP_LIST_KEY } from "@/config";
import { useAppContext } from "@/context/app-context";
import { getRedirection } from "@/utils/app-redirection";
// takin command:增加share 卡片
import Modal from "@/app/components/base/modal";
import type { AppListResponse } from "@/models/app";
import Input from "@/app/components/base/input";
type AppsProps = {
  pageType?: PageType;
  onSuccess?: () => void;
};

export enum PageType {
  EXPLORE = "explore",
  CREATE = "create",
}

const getKey = (
  pageIndex: number,
  previousPageData: AppListResponse,
  tags: string[],
  keywords: string
) => {
  if (!pageIndex || previousPageData.has_more) {
    const params: any = {
      url: "apps",
      params: { page: pageIndex + 1, limit: 30, name: keywords },
    };

    params.params.tag_ids = tags;
    return params;
  }
  return null;
};

const getExploreKey = (
  pageIndex: number,
  previousPageData: AppListResponse,
  mode: string
) => {
  if (!pageIndex || previousPageData.has_more) {
    console.log("mode", lowerCase(mode));
    const params: any = {
      url: "explore/apps",
      params: { page: pageIndex + 1, limit: 30, mode: lowerCase(mode) },
    };
    return params;
  }
  return null;
};

const Apps = ({ pageType = PageType.EXPLORE, onSuccess }: AppsProps) => {
  const { t } = useTranslation();
  const { isCurrentWorkspaceEditor } = useAppContext();
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const searchParamsAppId = searchParams.get("id");
  const searchParamsCategory = searchParams.get("category");
  const { hasEditPermission } = useContext(ExploreContext);

  const [showShare, setShowShare] = useState("");
  const [keywords, setKeywords] = useState("");
  const [searchKeywords, setSearchKeywords] = useState("");

  const { run: handleSearch } = useDebounceFn(
    () => {
      setSearchKeywords(keywords);
    },
    { wait: 500 }
  );

  const handleKeywordsChange = (value: string) => {
    setKeywords(value);
    handleSearch();
  };
  const anchorRef = useRef<HTMLDivElement>(null);

  const [currentType, setCurrentType] = useState<string>("");
  const [currCategory, setCurrCategory] = useTabSearchParams({
    defaultTab: "recommended",
    disableSearchParams: pageType !== PageType.EXPLORE,
  });

  const {
    data: exploreAppList,
    isLoading,
    mutate: exploreAppMutate,
    setSize: exploreAppSetSize,
  } = useSWRInfinite(
    (pageIndex: number, previousPageData: AppListResponse) => {
      if (currCategory === "favourite") return null;
      return getExploreKey(pageIndex, previousPageData, currCategory);
    },
    fetchExploreAppList,
    { revalidateFirstPage: true }
  );

  const { data, mutate, setSize } = useSWRInfinite(
    (pageIndex: number, previousPageData: AppListResponse) =>
      getKey(
        pageIndex,
        previousPageData,
        ["b0524f83-eb2d-4ede-b654-b1a2b9d5fb00"],
        searchKeywords
      ),
    appList,
    { revalidateFirstPage: true }
  );

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    if (anchorRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            currCategory === "favourite"
              ? setSize((size: number) => size + 1)
              : exploreAppSetSize((size: number) => size + 1);
          }
        },
        { rootMargin: "100px" }
      );
      observer.observe(anchorRef.current);
    }
    return () => observer?.disconnect();
  }, [anchorRef, mutate, exploreAppMutate, currCategory]);

  const [currApp, setCurrApp] = React.useState<App | null>(null);
  const [isShowCreateModal, setIsShowCreateModal] = React.useState(false);
  const onCreate: CreateAppModalProps["onConfirm"] = async ({
    name,
    icon_type,
    icon,
    icon_background,
    description,
  }) => {
    const { export_data } = await fetchAppDetail(currApp?.app.id as string);
    try {
      const app = await importApp({
        data: export_data,
        name,
        icon_type,
        icon,
        icon_background,
        description,
      });
      setIsShowCreateModal(false);
      Toast.notify({
        type: "success",
        message: t("app.newApp.appCreated"),
      });
      if (onSuccess) onSuccess();
      localStorage.setItem(NEED_REFRESH_APP_LIST_KEY, "1");
      getRedirection(isCurrentWorkspaceEditor, app, push);
    } catch (e) {
      Toast.notify({ type: "error", message: t("app.newApp.appCreateFailed") });
    }
  };

  useMemo(() => {
    if (searchParamsCategory) setCurrCategory(searchParamsCategory);
    else setCurrCategory("recommended");
    exploreAppMutate();
  }, [searchParamsCategory]);

  useMemo(() => {
    if (searchParamsAppId) setShowShare(searchParamsAppId);
  }, [searchParamsAppId]);

  useEffect(() => {
    if (localStorage.getItem(NEED_REFRESH_APP_LIST_KEY) === "1") {
      localStorage.removeItem(NEED_REFRESH_APP_LIST_KEY);
      mutate();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center">
        <Loading type="area" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        pageType === PageType.EXPLORE
          ? "h-full border-l border-gray-200"
          : "h-[calc(100%-56px)]"
      )}
    >
      {pageType === PageType.EXPLORE && (
        <div className="shrink-0 pt-6 px-12">
          <div className={`mb-1 ${s.textGradient} text-xl font-semibold`}>
            {t("explore.apps.title")}
          </div>
          <div className="text-gray-500 text-sm">
            {t("explore.apps.description")}
          </div>
        </div>
      )}
      <div
        className={cn(
          "flex items-center justify-between mt-6",
          pageType === PageType.EXPLORE ? "px-12" : "px-8"
        )}
      >
        <>
          {pageType !== PageType.EXPLORE && (
            <>
              <AppTypeSelector value={currentType} onChange={setCurrentType} />
              <div className="mx-2 w-[1px] h-3.5 bg-gray-200" />
            </>
          )}
          <Category
            value={currCategory}
            onChange={setCurrCategory}
            // allCategoriesEn={allCategoriesEn}
          />
        </>
        <Input
          showLeftIcon
          showClearIcon
          wrapperClassName="w-[200px]"
          value={keywords}
          onChange={(e) => handleKeywordsChange(e.target.value)}
          onClear={() => handleKeywordsChange("")}
        />
      </div>

      <div
        className={cn(
          "relative flex flex-1 pb-6 flex-col overflow-auto bg-gray-100 shrink-0 grow",
          pageType === PageType.EXPLORE ? "mt-4" : "mt-0 pt-2"
        )}
      >
        <nav
          className={cn(
            s.appList,
            "grid content-start shrink-0",
            pageType === PageType.EXPLORE
              ? "gap-4 px-6 sm:px-12"
              : "gap-3 px-8  sm:!grid-cols-2 md:!grid-cols-3 lg:!grid-cols-4"
          )}
        >
          {currCategory === "favourite" ? (
            <>
              {(data?.flatMap((data: any) => data?.data || []) || []).length >
              0 ? (
                data
                  ?.flatMap((data: any) => data?.data || [])
                  .map((app) => (
                    <StudioAppCard key={app.id} app={app} onRefresh={mutate} />
                  ))
              ) : (
                <div className="text-sm text-zinc-400 px-4">
                  No favourite apps have been added yet
                </div>
              )}
            </>
          ) : (
            <>
              {exploreAppList
                ?.flatMap((data: any) => data?.data || [])
                .map((app) => (
                  <AppCard
                    key={app.app_id}
                    isExplore={pageType === PageType.EXPLORE}
                    app={app}
                    canCreate={hasEditPermission}
                    onCreate={() => {
                      setCurrApp(app);
                      setIsShowCreateModal(true);
                    }}
                  />
                ))}
            </>
          )}
        </nav>
        <div ref={anchorRef} className="h-0" />
      </div>

      {isShowCreateModal && (
        <CreateAppModal
          appIconType={currApp?.app.icon_type || "emoji"}
          appIcon={currApp?.app.icon || ""}
          appIconBackground={currApp?.app.icon_background || ""}
          appIconUrl={currApp?.app.icon_url}
          appName={currApp?.app.name || ""}
          appDescription={currApp?.app.description || ""}
          show={isShowCreateModal}
          onConfirm={onCreate}
          onHide={() => setIsShowCreateModal(false)}
        />
      )}
      {/* takin command:增加share 卡片 */}
      <Modal
        isShow={!!showShare}
        className="!bg-transparent !shadow-none relative"
        onClose={() => setShowShare("")}
        wrapperClassName="pt-[60px]"
      >
        <div
          className="absolute right-4 top-4 p-4 cursor-pointer"
          onClick={() => setShowShare("")}
        >
          <RiCloseLine className="w-4 h-4 text-gray-500" />
        </div>
        {/* {allList
          .filter((app) => app.app_id === showShare)
          .map((app) => (
            <ShareAppCard
              key={app.app_id}
              isExplore={pageType === PageType.EXPLORE}
              app={app}
              canCreate={hasEditPermission}
              onCreate={() => {
                setCurrApp(app);
                setIsShowCreateModal(true);
              }}
            />
          ))} */}
      </Modal>
    </div>
  );
};

export default React.memo(Apps);
