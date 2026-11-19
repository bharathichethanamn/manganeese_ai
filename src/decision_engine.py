"""
ManganeseAI - Module 3: AI Recommendation & Decision Support Engine
Combines Reserve Potential + Production Forecast + Shortfall Risk + Equipment Health + Environmental Intelligence
to generate composite Mining Intelligence Scores (0-100), Risk-to-Action priorities, Quantified Recovery Impacts (via What-If ML simulator),
Early Warnings, and Zone-to-Zone Prioritization Recommendations.
"""


class AIDecisionEngine:
    def __init__(self, simulator_obj=None):
        self.simulator = simulator_obj

    def calculate_mining_intelligence_score(self, res_pred, prod_pred, short_pred, env_score_data, zone_dict):
        """
        Calculates composite 0-100 Mining Intelligence Score synthesizing all 5 intelligence pillars.
        """
        # 1. Reserve Potential (25%)
        reserve_score = float(res_pred.get("potential_score", 75.0))

        # 2. Production Health (25%)
        achievement_pct = float(prod_pred.get("achievement_pct", 90.0))
        prod_health_score = min(100.0, achievement_pct)

        # 3. Shortfall Risk Inverse (20%)
        prob_pct = float(short_pred.get("shortfall_probability_pct", 50.0))
        shortfall_health_score = max(0.0, 100.0 - prob_pct)

        # 4. Equipment Health (15%)
        avail = float(zone_dict.get("equipment_availability", 75.0))
        downtime = float(zone_dict.get("equipment_downtime", 12.0))
        equip_score = max(0.0, min(100.0, avail - (downtime * 1.5)))

        # 5. Environmental Condition (15%)
        env_score = float(env_score_data.get("environmental_score", 70.0))

        # Weighted composite sum
        total_score = round(
            (reserve_score * 0.25) +
            (prod_health_score * 0.25) +
            (shortfall_health_score * 0.20) +
            (equip_score * 0.15) +
            (env_score * 0.15),
            1
        )

        if total_score >= 85.0:
            status = "EXCELLENT"
            color = "#10B981"
        elif total_score >= 70.0:
            status = "GOOD"
            color = "#3B82F6"
        elif total_score >= 55.0:
            status = "MODERATE"
            color = "#F59E0B"
        else:
            status = "CRITICAL"
            color = "#EF4444"

        return {
            "mine_intelligence_score": total_score,
            "status": status,
            "status_color": color,
            "pillar_contributions": {
                "reserve_potential": {"weight": 25, "score": round(reserve_score, 1)},
                "production_health": {"weight": 25, "score": round(prod_health_score, 1)},
                "shortfall_risk_health": {"weight": 20, "score": round(shortfall_health_score, 1)},
                "equipment_health": {"weight": 15, "score": round(equip_score, 1)},
                "environmental_condition": {"weight": 15, "score": round(env_score, 1)}
            }
        }

    def generate_recommendations(self, zone_dict, res_pred, prod_pred, short_pred, env_score_data):
        """
        Generates multi-factor risk-to-action recommendations with priority tags, expected recovery impact, and ranking.
        """
        downtime = float(zone_dict.get("equipment_downtime", 15.0))
        avail = float(zone_dict.get("equipment_availability", 75.0))
        rain = float(zone_dict.get("rainfall_mm", 1300.0))
        moisture = float(zone_dict.get("soil_moisture_pct", 35.0))
        blast_delay = float(zone_dict.get("blasting_delay", 4.0))

        risk_level = short_pred.get("risk_level", "HIGH")
        gap_tons = float(prod_pred.get("production_gap_monthly", 850.0))

        recommendations = []

        # Action 1: Equipment Downtime & Maintenance Optimization
        if downtime > 10.0 or avail < 80.0:
            rec_downtime = max(2.0, downtime - 6.0)
            rec_avail = min(95.0, avail + 10.0)

            # Quantify actual impact using What-If Simulator
            recovered_tons = 0.0
            if self.simulator is not None:
                sim_res = self.simulator.simulate(
                    zone_dict,
                    {
                        "equipment_downtime": rec_downtime,
                        "equipment_availability": rec_avail,
                        "blasting_delay": blast_delay,
                        "rainfall": rain / 10.0
                    }
                )
                b_forecast = sim_res["baseline"]["forecast_production"] * 30.0
                s_forecast = sim_res["simulated"]["forecast_production"] * 30.0
                recovered_tons = max(0.0, round(s_forecast - b_forecast, 0))

            prio = "CRITICAL" if downtime >= 16.0 or risk_level == "HIGH" else "HIGH"
            prio_color = "#EF4444" if prio == "CRITICAL" else "#F59E0B"

            recommendations.append({
                "rank": 1,
                "id": "REC-01",
                "title": "Mobile Haulage Fleet Maintenance & Downtime Reduction",
                "risk_detected": f"Excessive Equipment Downtime ({downtime} hrs) & Availability ({avail}%)",
                "priority": prio,
                "priority_color": prio_color,
                "recommended_action": f"Deploy secondary standby haulage trucks and schedule preventive maintenance to reduce downtime from {downtime} hrs to {rec_downtime} hrs.",
                "expected_impact": f"Estimated recovery of +{int(recovered_tons):,} tons/month of production gap." if recovered_tons > 0 else "High risk reduction across mining shifts.",
                "recovered_tons": recovered_tons
            })

        # Action 2: Monsoon Pit Dewatering & Haul Road Rerouting
        if rain > 1300.0 or moisture > 35.0:
            rec_rain = rain * 0.7  # Dewatering simulation factor

            recovered_tons_env = 0.0
            if self.simulator is not None:
                sim_res = self.simulator.simulate(
                    zone_dict,
                    {
                        "equipment_downtime": downtime,
                        "equipment_availability": avail,
                        "blasting_delay": blast_delay,
                        "rainfall": rec_rain / 10.0
                    }
                )
                b_forecast = sim_res["baseline"]["forecast_production"] * 30.0
                s_forecast = sim_res["simulated"]["forecast_production"] * 30.0
                recovered_tons_env = max(0.0, round(s_forecast - b_forecast, 0))

            recommendations.append({
                "rank": 2,
                "id": "REC-02",
                "title": "High-Capacity Pit Dewatering & Bench Road Elevation",
                "risk_detected": f"Heavy Rainfall ({rain} mm) & Soil Moisture Saturation ({moisture}%)",
                "priority": "HIGH" if rain > 1400.0 else "MEDIUM",
                "priority_color": "#F59E0B" if rain > 1400.0 else "#3B82F6",
                "recommended_action": "Install 250 HP submersible pit dewatering pumps in open-cast benches and reroute haul trucks to elevated hard rock benches.",
                "expected_impact": f"Prevents pit flooding; estimated production recovery of +{int(recovered_tons_env):,} tons/month.",
                "recovered_tons": recovered_tons_env
            })

        # Action 3: Blasting Shift Synchronization
        if blast_delay > 2.0:
            recommendations.append({
                "rank": 3,
                "id": "REC-03",
                "title": "Blasting Charge Pattern & Shift Clearance Synchronization",
                "risk_detected": f"Blasting Delays ({blast_delay} hrs)",
                "priority": "MEDIUM",
                "priority_color": "#3B82F6",
                "recommended_action": "Optimize electronic delay detonator charge patterns and coordinate evacuation safety windows during shift changeovers.",
                "expected_impact": "Eliminates ~3.5 hours of unproductive shift delays, improving excavator turnaround.",
                "recovered_tons": 250.0
            })

        # Sort recommendations by priority & recovered tons
        recommendations.sort(key=lambda x: (x["priority"] == "CRITICAL", x["recovered_tons"]), reverse=True)
        for idx, rec in enumerate(recommendations):
            rec["rank"] = idx + 1

        return recommendations

    def get_early_warnings(self, zone_dict, short_pred, env_anomalies, prod_pred):
        """
        Generates Early Warning alerts for critical operational & environmental threats.
        """
        warnings = []
        zone_id = zone_dict.get("zone_id", "Z01")

        prob_pct = float(short_pred.get("shortfall_probability_pct", 0.0))
        downtime = float(zone_dict.get("equipment_downtime", 0.0))
        gap_tons = float(prod_pred.get("production_gap_monthly", 0.0))

        if prob_pct >= 65.0:
            warnings.append({
                "id": "EW-01",
                "zone_id": zone_id,
                "type": "SHORTFALL RISK ALERT",
                "severity": "HIGH",
                "color": "#EF4444",
                "title": f"High Shortfall Risk Detected in Zone {zone_id}",
                "reason": f"Shortfall probability is at {prob_pct}%, with an expected gap of {int(gap_tons):,} tons against monthly target.",
                "action": "Immediate fleet maintenance intervention required."
            })

        if downtime >= 15.0:
            warnings.append({
                "id": "EW-02",
                "zone_id": zone_id,
                "type": "EQUIPMENT DOWNTIME WARNING",
                "severity": "HIGH",
                "color": "#F59E0B",
                "title": f"Abnormal Equipment Downtime in Zone {zone_id}",
                "reason": f"Equipment downtime reached {downtime} hours, exceeding the regional safety threshold of 10 hours.",
                "action": "Schedule emergency overhaul for haulage fleet."
            })

        for anomaly in env_anomalies:
            warnings.append({
                "id": f"EW-ENV-{anomaly['metric']}",
                "zone_id": zone_id,
                "type": "ENVIRONMENTAL ANOMALY",
                "severity": anomaly["severity"],
                "color": "#EF4444" if "SEVERE" in anomaly["severity"] else "#F59E0B",
                "title": f"Environmental Anomaly: {anomaly['metric']}",
                "reason": anomaly["message"],
                "action": "Deploy environmental containment & monitoring units."
            })

        return warnings

    def get_decision_summary(self, zone_dict, res_pred, prod_pred, short_pred, env_score_data):
        """
        Synthesizes single-card Decision Summary for selected zone.
        """
        zone_id = zone_dict.get("zone_id", "Z01")
        res_class = res_pred.get("potential_class", "MEDIUM POTENTIAL")
        prod_status = "BELOW TARGET" if prod_pred.get("production_gap_monthly", 0) > 0 else "TARGET ACHIEVED"
        short_level = short_pred.get("risk_level", "HIGH")
        env_status = env_score_data.get("status", "MODERATE")

        downtime = float(zone_dict.get("equipment_downtime", 12.0))
        rain = float(zone_dict.get("rainfall_mm", 1200.0))

        main_issue = []
        if downtime > 12.0:
            main_issue.append("High Equipment Downtime")
        if rain > 1300.0:
            main_issue.append("Monsoon Rainfall Pit Saturation")
        if not main_issue:
            main_issue.append("Operational Target Optimization")

        main_issue_str = " + ".join(main_issue)
        priority_action = f"Optimize equipment availability in {zone_id} and reschedule weather-sensitive open-cast excavation."

        return {
            "zone_id": zone_id,
            "reserve_class": res_class,
            "production_status": prod_status,
            "shortfall_risk": short_level,
            "environmental_condition": env_status,
            "main_issue": main_issue_str,
            "priority_action": priority_action
        }

    def compare_zones_prioritization(self, zone_a_full, zone_b_full):
        """
        Compares Zone A vs Zone B across all 5 pillars and recommends which zone should be prioritized.
        """
        zA_data = zone_a_full["zone_data"]
        zB_data = zone_b_full["zone_data"]

        zA_id = zA_data["zone_id"]
        zB_id = zB_data["zone_id"]

        score_a = zone_a_full["intel_score"]["mine_intelligence_score"]
        score_b = zone_b_full["intel_score"]["mine_intelligence_score"]

        res_a = zone_a_full["reserve_prediction"]["potential_score"]
        res_b = zone_b_full["reserve_prediction"]["potential_score"]

        gap_a = zone_a_full["production_prediction"]["production_gap_monthly"]
        gap_b = zone_b_full["production_prediction"]["production_gap_monthly"]

        risk_a = zone_a_full["shortfall_prediction"]["shortfall_probability_pct"]
        risk_b = zone_b_full["shortfall_prediction"]["shortfall_probability_pct"]

        env_a = zone_a_full["environmental"]["environmental_score"]
        env_b = zone_b_full["environmental"]["environmental_score"]

        # Recommendation logic
        if gap_a > gap_b and risk_a > risk_b:
            prioritized_zone = zA_id
            reason = f"Zone {zA_id} has a larger monthly production gap ({int(gap_a):,} tons) and higher shortfall risk ({risk_a}%), requiring immediate operational intervention."
        elif gap_b > gap_a and risk_b > risk_a:
            prioritized_zone = zB_id
            reason = f"Zone {zB_id} has a larger monthly production gap ({int(gap_b):,} tons) and higher shortfall risk ({risk_b}%), requiring immediate operational intervention."
        elif res_a > res_b:
            prioritized_zone = zA_id
            reason = f"Zone {zA_id} exhibits higher reserve potential score ({res_a}/100 vs {res_b}/100) and should be prioritized for excavation allocation."
        else:
            prioritized_zone = zB_id
            reason = f"Zone {zB_id} exhibits higher reserve potential score ({res_b}/100 vs {res_a}/100) and should be prioritized for excavation allocation."

        return {
            "zone_a": {
                "id": zA_id,
                "mine_intel_score": score_a,
                "reserve_score": res_a,
                "production_gap": gap_a,
                "shortfall_prob": risk_a,
                "environmental_score": env_a
            },
            "zone_b": {
                "id": zB_id,
                "mine_intel_score": score_b,
                "reserve_score": res_b,
                "production_gap": gap_b,
                "shortfall_prob": risk_b,
                "environmental_score": env_b
            },
            "prioritized_zone": prioritized_zone,
            "recommendation_reason": reason
        }
