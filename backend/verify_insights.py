import asyncio
from datetime import datetime, timezone
from app.database import db
from app.services.pandas_service import PandasAnalyticsService
from app.services.insight_service import InsightService
from app.services.ai_insight_service import AIInsightService

async def main():
    print("==================================================")
    print("Running Automated Verification of Insights Module")
    print("==================================================")
    
    # 1. Fetch a user ID from the database to test
    user = await db["users"].find_one()
    if not user:
        print("[-] Warning: No users found in database. Using a fallback mock user ID.")
        user_id = "mock_user_123"
    else:
        user_id = str(user["_id"])
        print(f"[+] Found user in DB to test: {user_id} ({user.get('email', 'no email')})")
        
    # 2. Test Pandas Analytics Service Loading
    try:
        print("\n--- Testing PandasAnalyticsService.load_expenses_dataframe ---")
        df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
        df_prepared = PandasAnalyticsService.prepare_dataframe(df)
        print(f"[+] Loaded DataFrame columns: {list(df_prepared.columns)}")
        print(f"[+] Row count: {len(df_prepared)}")
    except Exception as e:
        print(f"[-] FAILED: load_expenses_dataframe: {str(e)}")
        return

    # 3. Test Heatmap & Running Balance Service Calculations
    try:
        print("\n--- Testing PandasAnalyticsService Heatmap & Running Balance ---")
        heatmap = PandasAnalyticsService.get_category_heatmap(df_prepared)
        print(f"[+] Heatmap output has {len(heatmap)} rows. Keys in first row: {list(heatmap[0].keys()) if heatmap else 'N/A'}")
        
        rb = PandasAnalyticsService.get_running_balance(df_prepared)
        print(f"[+] Running balance output has {len(rb)} entries. First item: {rb[0] if rb else 'N/A'}")
    except Exception as e:
        print(f"[-] FAILED: Heatmap/RunningBalance: {str(e)}")
        return

    # 4. Test Insights calendar heatmap
    try:
        print("\n--- Testing InsightService.get_calendar_heatmap ---")
        cal = await InsightService.get_calendar_heatmap(user_id)
        print(f"[+] Generated calendar with {len(cal)} days.")
        if cal:
            print(f"[+] First day item schema: {cal[0]}")
            assert "date" in cal[0]
            assert "amount" in cal[0]
            assert "intensity" in cal[0]
            assert 0 <= cal[0]["intensity"] <= 4
            print("[+] Calendar Heatmap structure validated successfully!")
    except Exception as e:
        print(f"[-] FAILED: get_calendar_heatmap: {str(e)}")
        return

    # 5. Test Budget vs Actual
    try:
        print("\n--- Testing InsightService.get_budget_vs_actual ---")
        now = datetime.now(timezone.utc)
        month = now.month
        year = now.year
        items = await InsightService.get_budget_vs_actual(user_id, month, year)
        print(f"[+] Report category budget count: {len(items)}")
        if items:
            print(f"[+] Item schema: {items[0]}")
            item = items[0]
            assert "category" in item
            assert "budget" in item
            assert "actual" in item
            assert "remaining" in item
            assert "percentage_used" in item
            assert "status" in item
        print("[+] Budget vs Actual structure validated successfully!")
    except Exception as e:
        print(f"[-] FAILED: get_budget_vs_actual: {str(e)}")
        return

    # 6. Test Word Cloud
    try:
        print("\n--- Testing InsightService.get_word_cloud ---")
        words = await InsightService.get_word_cloud(user_id)
        print(f"[+] Word Cloud returned {len(words)} unique terms (max 20).")
        if words:
            print(f"[+] Top items: {words[:5]}")
            assert "text" in words[0]
            assert "value" in words[0]
        print("[+] Word Cloud structure validated successfully!")
    except Exception as e:
        print(f"[-] FAILED: get_word_cloud: {str(e)}")
        return

    # 7. Test Weekly Comparison
    try:
        print("\n--- Testing InsightService.get_weekly_comparison ---")
        weekly = await InsightService.get_weekly_comparison(user_id)
        print(f"[+] Weekly comparison metrics: {weekly}")
        assert "this_week" in weekly
        assert "last_week" in weekly
        assert "percentage_change" in weekly
        assert "difference" in weekly
        assert "trend" in weekly
        assert weekly["trend"] in ["up", "down", "stable"]
        print("[+] Weekly Comparison structure validated successfully!")
    except Exception as e:
        print(f"[-] FAILED: get_weekly_comparison: {str(e)}")
        return

    # 8. Test Spending Pattern
    try:
        print("\n--- Testing InsightService.get_spending_pattern ---")
        pattern = await InsightService.get_spending_pattern(user_id)
        print(f"[+] Spending Pattern metrics: {pattern}")
        assert "most_active_day" in pattern
        assert "most_active_hour" in pattern
        assert "average_transaction" in pattern
        assert "favorite_category" in pattern
        print("[+] Spending Pattern structure validated successfully!")
    except Exception as e:
        print(f"[-] FAILED: get_spending_pattern: {str(e)}")
        return

    # 9. Test AI Spending Summary
    try:
        print("\n--- Testing AIInsightService.get_ai_summary ---")
        ai_summary = await AIInsightService.get_ai_summary(user_id)
        print(f"[+] AI Summary output: {ai_summary}")
        assert "top_spending_day" in ai_summary
        assert "top_category" in ai_summary
        assert "overspending_detected" in ai_summary
        assert "recommended_saving" in ai_summary
        assert "message" in ai_summary
        print("[+] AI Spending Summary structure validated successfully!")
    except Exception as e:
        print(f"[-] FAILED: get_ai_summary: {str(e)}")
        return

    print("\n==================================================")
    print("[+] ALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
