import json
import logging
from os import path
from pathlib import Path
from typing import Optional

import requests
from flask import current_app
from flask_sqlalchemy.pagination import Pagination

from configs import dify_config
from constants.languages import languages
from extensions.ext_database import collection, db
from models.model import Account, App, RecommendedApp
from services.app_dsl_service import AppDslService

logger = logging.getLogger(__name__)


class RecommendedAppService:
    builtin_data: Optional[dict] = None

    @classmethod
    def get_paginate_recommended_apps(cls, language: str, args: dict) -> Pagination | None:
        filters = [
         RecommendedApp.is_listed == True, 
         App.is_public == True
        ]
        if args.get("name"):
            name = args["name"][:30]
            filters.append(App.name.ilike(f"%{name}%"))
            
        if args["mode"] == "recommended":
            filters.append(Account.email == "curator@takin.ai")
        else:
            filters.append(Account.email != "curator@takin.ai")  
            
        recommended_apps = db.paginate(
            db.select(RecommendedApp)
            .select_from(RecommendedApp)  # Start from RecommendedApp
            .join(App, RecommendedApp.app_id == App.id)  # Join with App on 
            .join(Account, Account.id == App.user_id)  # Then join with Account 
            .where(*filters)
            .order_by(RecommendedApp.created_at.desc()),
            page=args["page"],
            per_page=args["limit"],
            error_out=False,
        )

        return recommended_apps
   
    @classmethod
    def get_recommended_apps_and_categories(cls, language: str) -> dict:
        """
        Get recommended apps and categories.
        :param language: language
        :return:
        """
        mode = dify_config.HOSTED_FETCH_APP_TEMPLATES_MODE
        if mode == "remote":
            try:
                result = cls._fetch_recommended_apps_from_dify_official(language)
            except Exception as e:
                logger.warning(f"fetch recommended apps from dify official failed: {e}, switch to built-in.")
                result = cls._fetch_recommended_apps_from_builtin(language)
        elif mode == "db":
            result = cls._fetch_recommended_apps_from_db(language)
        elif mode == "builtin":
            result = cls._fetch_recommended_apps_from_builtin(language)
        else:
            raise ValueError(f"invalid fetch recommended apps mode: {mode}")

        if not result.get("recommended_apps") and language != "en-US":
            result = cls._fetch_recommended_apps_from_builtin("en-US")

        return result

    @classmethod
    def _fetch_recommended_apps_from_db(cls, language: str) -> dict:
        """
        Fetch recommended apps from db.
        :param language: language
        :return:
        """
        recommended_apps = (
            db.session.query(RecommendedApp)
            .filter(RecommendedApp.is_listed == True, RecommendedApp.language == language)
            .order_by(RecommendedApp.created_at.desc())  # takin command:添加排序
            .all()
        )

        if len(recommended_apps) == 0:
            recommended_apps = (
                db.session.query(RecommendedApp)
                .filter(
                    RecommendedApp.is_listed == True,
                    RecommendedApp.language == languages[0],
                )
                .order_by(RecommendedApp.created_at.desc())  # takin command:添加排序
                .all()
            )

        categories = set()
        recommended_apps_result = []
        community_apps_result = []
        for recommended_app in recommended_apps:
            app = recommended_app.app
            if not app or not app.is_public:
                continue

            # Takin command:此处暂时隐藏
            # site = app.site
            # if not site:
            #     continue

            user = db.session.query(Account).filter(Account.id == app.user_id).first()
            doc = collection.find_one({"email": user.email})
            app_result = {
                "id": recommended_app.id,
                "app": {
                    "id": app.id,
                    "name": app.name,
                    "mode": app.mode,
                    "icon": app.icon,
                    "icon_background": app.icon_background,
                    "username": doc.get("name") or user.name,
                },
                "app_id": recommended_app.app_id,
                "description": app.description,
                "copyright": "",
                "privacy_policy": "",
                "custom_disclaimer": "",
                "category": recommended_app.category,
                "position": recommended_app.position,
                "is_listed": recommended_app.is_listed,
            }
            # Takin.AI command 修改推荐的app TODO: 根据用户角色区分 -[mongo role = 50] admin的role才能推送到recommended_apps_result
            if user.email == "curator@takin.ai":
                recommended_apps_result.append(app_result)
            else:
                community_apps_result.append(app_result)

            categories.add(recommended_app.category)  # add category to categories

        return {
            "recommended_apps": recommended_apps_result,
            "community": community_apps_result,
            "categories": sorted(categories),
        }

    @classmethod
    def _fetch_recommended_apps_from_dify_official(cls, language: str) -> dict:
        """
        Fetch recommended apps from dify official.
        :param language: language
        :return:
        """
        domain = dify_config.HOSTED_FETCH_APP_TEMPLATES_REMOTE_DOMAIN
        url = f"{domain}/apps?language={language}"
        response = requests.get(url, timeout=(3, 10))
        if response.status_code != 200:
            raise ValueError(f"fetch recommended apps failed, status code: {response.status_code}")

        result = response.json()

        if "categories" in result:
            result["categories"] = sorted(result["categories"])

        return result

    @classmethod
    def _fetch_recommended_apps_from_builtin(cls, language: str) -> dict:
        """
        Fetch recommended apps from builtin.
        :param language: language
        :return:
        """
        builtin_data = cls._get_builtin_data()
        return builtin_data.get("recommended_apps", {}).get(language)

    @classmethod
    def get_recommend_app_detail(cls, app_id: str) -> Optional[dict]:
        """
        Get recommend app detail.
        :param app_id: app id
        :return:
        """
        mode = dify_config.HOSTED_FETCH_APP_TEMPLATES_MODE
        if mode == "remote":
            try:
                result = cls._fetch_recommended_app_detail_from_dify_official(app_id)
            except Exception as e:
                logger.warning(f"fetch recommended app detail from dify official failed: {e}, switch to built-in.")
                result = cls._fetch_recommended_app_detail_from_builtin(app_id)
        elif mode == "db":
            result = cls._fetch_recommended_app_detail_from_db(app_id)
        elif mode == "builtin":
            result = cls._fetch_recommended_app_detail_from_builtin(app_id)
        else:
            raise ValueError(f"invalid fetch recommended app detail mode: {mode}")

        return result

    @classmethod
    def _fetch_recommended_app_detail_from_dify_official(cls, app_id: str) -> Optional[dict]:
        """
        Fetch recommended app detail from dify official.
        :param app_id: App ID
        :return:
        """
        domain = dify_config.HOSTED_FETCH_APP_TEMPLATES_REMOTE_DOMAIN
        url = f"{domain}/apps/{app_id}"
        response = requests.get(url, timeout=(3, 10))
        if response.status_code != 200:
            return None

        return response.json()

    @classmethod
    def _fetch_recommended_app_detail_from_db(cls, app_id: str) -> Optional[dict]:
        """
        Fetch recommended app detail from db.
        :param app_id: App ID
        :return:
        """
        # is in public recommended list
        recommended_app = (
            db.session.query(RecommendedApp)
            .filter(RecommendedApp.is_listed == True, RecommendedApp.app_id == app_id)
            .first()
        )

        if not recommended_app:
            return None

        # get app detail
        app_model = db.session.query(App).filter(App.id == app_id).first()
        if not app_model or not app_model.is_public:
            return None

        return {
            "id": app_model.id,
            "name": app_model.name,
            "icon": app_model.icon,
            "icon_background": app_model.icon_background,
            "mode": app_model.mode,
            "export_data": AppDslService.export_dsl(app_model=app_model),
        }

    @classmethod
    def _fetch_recommended_app_detail_from_builtin(cls, app_id: str) -> Optional[dict]:
        """
        Fetch recommended app detail from builtin.
        :param app_id: App ID
        :return:
        """
        builtin_data = cls._get_builtin_data()
        return builtin_data.get("app_details", {}).get(app_id)

    @classmethod
    def _get_builtin_data(cls) -> dict:
        """
        Get builtin data.
        :return:
        """
        if cls.builtin_data:
            return cls.builtin_data

        root_path = current_app.root_path
        cls.builtin_data = json.loads(
            Path(path.join(root_path, "constants", "recommended_apps.json")).read_text(encoding="utf-8")
        )

        return cls.builtin_data

    @classmethod
    def fetch_all_recommended_apps_and_export_datas(cls):
        """
        Fetch all recommended apps and export datas
        :return:
        """
        templates = {"recommended_apps": {}, "app_details": {}}
        for language in languages:
            try:
                result = cls._fetch_recommended_apps_from_dify_official(language)
            except Exception as e:
                logger.warning(f"fetch recommended apps from dify official failed: {e}, skip.")
                continue

            templates["recommended_apps"][language] = result

            for recommended_app in result.get("recommended_apps"):
                app_id = recommended_app.get("app_id")

                # get app detail
                app_detail = cls._fetch_recommended_app_detail_from_dify_official(app_id)
                if not app_detail:
                    continue

                templates["app_details"][app_id] = app_detail

        return templates

    def create_app(self, args: dict) -> dict:
        app = RecommendedApp(
            app_id=args["app_id"],
            category=args.get("category", ""),
            description=args.get("description", ""),
            copyright="Takin.AI",
            privacy_policy="https://Takin.ai",
        )

        # 将app添加到session并提交
        db.session.add(app)
        db.session.commit()

        app_to_update = db.session.query(App).filter_by(id=args["app_id"]).first()
        if app_to_update:
            app_to_update.is_public = True
            db.session.commit()

        return {"id": app.id}

    def delete_app(self, id: str) -> None:
        """
        Delete recommended app
        """
        try:
            app_to_delete = db.session.query(RecommendedApp).filter_by(app_id=id).one()

            db.session.delete(app_to_delete)
            db.session.commit()
        except Exception as e:
            logging.error(f"An error occurred: {e}")
            db.session.rollback()
