import json
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from .models import User, Membership, PlatformSetting

DEFAULT_VIP_LEVELS_CONFIG: List[Dict[str, Any]] = [
    {
        "level": 0,
        "name": "VIP 0",
        "tag": "Entry Member",
        "threshold": 0.0,
        "next_threshold": 2000.0,
        "next_level": 1,
        "withdrawal_day": "Sunday",
        "task_desc": "Buy ₹2,000 in product plans to promote to VIP Level 1",
    },
    {
        "level": 1,
        "name": "VIP 1",
        "tag": "Bronze Member",
        "threshold": 2000.0,
        "next_threshold": 4000.0,
        "next_level": 2,
        "withdrawal_day": "Saturday",
        "task_desc": "Reach ₹4,000 in total plan purchases to unlock VIP Level 2",
    },
    {
        "level": 2,
        "name": "VIP 2",
        "tag": "Silver Member",
        "threshold": 4000.0,
        "next_threshold": 6000.0,
        "next_level": 3,
        "withdrawal_day": "Friday",
        "task_desc": "Reach ₹6,000 in total plan purchases to unlock VIP Level 3",
    },
    {
        "level": 3,
        "name": "VIP 3",
        "tag": "Gold Member",
        "threshold": 6000.0,
        "next_threshold": 8000.0,
        "next_level": 4,
        "withdrawal_day": "Thursday",
        "task_desc": "Reach ₹8,000 in total plan purchases to unlock VIP Level 4",
    },
    {
        "level": 4,
        "name": "VIP 4",
        "tag": "Platinum Member",
        "threshold": 8000.0,
        "next_threshold": 10000.0,
        "next_level": 5,
        "withdrawal_day": "Wednesday",
        "task_desc": "Reach ₹10,000 in total plan purchases to unlock VIP Level 5",
    },
    {
        "level": 5,
        "name": "VIP 5",
        "tag": "Diamond Member",
        "threshold": 10000.0,
        "next_threshold": 12000.0,
        "next_level": 6,
        "withdrawal_day": "Tuesday",
        "task_desc": "Reach ₹12,000 in total plan purchases to unlock VIP Level 6",
    },
    {
        "level": 6,
        "name": "VIP 6",
        "tag": "Crown Member",
        "threshold": 12000.0,
        "next_threshold": 14000.0,
        "next_level": 7,
        "withdrawal_day": "Monday",
        "task_desc": "Reach ₹14,000 in total plan purchases to unlock VIP Level 7",
    },
    {
        "level": 7,
        "name": "VIP 7",
        "tag": "Elite Member",
        "threshold": 14000.0,
        "next_threshold": None,
        "next_level": None,
        "withdrawal_day": "Daily Priority",
        "task_desc": "Maximum VIP Tier Achieved! Priority daily withdrawals active.",
    },
]

VIP_LEVELS_CONFIG = DEFAULT_VIP_LEVELS_CONFIG


def get_vip_levels_config(db: Session) -> List[Dict[str, Any]]:
    """Fetch configurable VIP levels and thresholds from platform_settings, falling back to defaults."""
    setting = db.query(PlatformSetting).filter(PlatformSetting.key == "vip_levels_config").first()
    if setting and setting.value:
        try:
            parsed = json.loads(setting.value)
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed
        except Exception:
            pass
    return DEFAULT_VIP_LEVELS_CONFIG


def save_vip_levels_config(db: Session, config: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Save updated VIP levels configuration (thresholds, withdrawal days, etc.) to database."""
    # Ensure items are ordered by level
    sorted_cfg = sorted(config, key=lambda x: x.get("level", 0))

    # Re-link next_threshold and next_level accurately
    for i in range(len(sorted_cfg)):
        if i < len(sorted_cfg) - 1:
            sorted_cfg[i]["next_level"] = sorted_cfg[i + 1]["level"]
            sorted_cfg[i]["next_threshold"] = sorted_cfg[i + 1]["threshold"]
            sorted_cfg[i]["task_desc"] = f"Reach ₹{sorted_cfg[i + 1]['threshold']:,.0f} in plan purchases to unlock {sorted_cfg[i + 1]['name']}"
        else:
            sorted_cfg[i]["next_level"] = None
            sorted_cfg[i]["next_threshold"] = None
            sorted_cfg[i]["task_desc"] = "Maximum VIP Tier Achieved! Priority daily withdrawals active."

    setting = db.query(PlatformSetting).filter(PlatformSetting.key == "vip_levels_config").first()
    if not setting:
        setting = PlatformSetting(
            key="vip_levels_config",
            value=json.dumps(sorted_cfg),
            description="Dynamic VIP Levels thresholds and withdrawal days configuration"
        )
        db.add(setting)
    else:
        setting.value = json.dumps(sorted_cfg)
    db.commit()
    return sorted_cfg


def calculate_vip_level(total_purchases: float, config: Optional[List[Dict[str, Any]]] = None) -> int:
    """Calculate the VIP level based on cumulative plan purchase amount and config."""
    cfg = config or DEFAULT_VIP_LEVELS_CONFIG
    sorted_tiers = sorted(cfg, key=lambda x: x["threshold"], reverse=True)
    for tier in sorted_tiers:
        if total_purchases >= tier["threshold"]:
            return tier["level"]
    return 0


def get_user_vip_progress(user_id: int, db: Session, user: Optional[User] = None) -> Dict[str, Any]:
    """
    Returns the user's current VIP level, cumulative plan purchase sum,
    target for the next level, and the prompt/task to reach next tier.
    """
    if not user:
        user = db.query(User).filter(User.id == user_id).first()

    # Dynamically read current configured tiers
    levels_config = get_vip_levels_config(db)

    # Calculate total money spent on buying plans
    total_bought = db.query(func.coalesce(func.sum(Membership.price_paid), 0.0)).filter(
        Membership.user_id == user_id
    ).scalar() or 0.0

    auto_level = calculate_vip_level(total_bought, levels_config)
    stored_level = getattr(user, "vip_level", 0) if user else 0
    current_level = max(auto_level, stored_level or 0)

    # Sync to DB if auto promoted
    if user and auto_level > (stored_level or 0):
        user.vip_level = auto_level
        db.commit()

    current_config = next((cfg for cfg in levels_config if cfg["level"] == current_level), levels_config[0])

    next_level = current_config.get("next_level")
    next_threshold = current_config.get("next_threshold")

    if next_threshold is not None:
        amount_needed = max(0.0, next_threshold - total_bought)
        base = current_config["threshold"]
        span = next_threshold - base
        progress_pct = min(100.0, max(0.0, ((total_bought - base) / span) * 100.0)) if span > 0 else 0.0
        task_prompt = f"Buy ₹{amount_needed:,.0f} more in plans to unlock VIP Level {next_level}!"
    else:
        amount_needed = 0.0
        progress_pct = 100.0
        task_prompt = f"Maximum {current_config['name']} unlocked! Top elite privileges active."

    return {
        "current_level": current_level,
        "level_name": current_config["name"],
        "level_tag": current_config["tag"],
        "total_plan_purchases": round(float(total_bought), 2),
        "current_threshold": current_config["threshold"],
        "next_level": next_level,
        "next_threshold": next_threshold,
        "amount_needed": round(amount_needed, 2),
        "progress_percent": round(progress_pct, 1),
        "withdrawal_day": current_config["withdrawal_day"],
        "task_prompt": task_prompt,
        "all_levels": levels_config
    }
