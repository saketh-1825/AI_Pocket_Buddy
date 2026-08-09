import pytest
from datetime import datetime, timezone
import app.database

@pytest.mark.asyncio
async def test_get_calendar_heatmap(client, test_user):
    headers = test_user["headers"]
    user_id = test_user["user_id"]
    
    # We can query heatmap without expenses (it should scaffold 365 days)
    response = await client.get("/insights/calendar-heatmap", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "heatmap" in data
    assert len(data["heatmap"]) == 365
    
    # Check that day records have required keys
    first_day = data["heatmap"][0]
    assert "date" in first_day
    assert "amount" in first_day
    assert "intensity" in first_day

