import pytest

import tuffy_advisor
from tuffy_advisor import TuffyStyleAdvisor, TuffyUnavailable, rule_based_style_tip


class FakeResponse:
    def __init__(self, text):
        self.text = text


class FakeChat:
    def __init__(self, replies):
        self.replies = replies
        self.sent = []

    def send_message(self, message):
        self.sent.append(message)
        reply = self.replies.pop(0)
        if isinstance(reply, Exception):
            raise reply
        return FakeResponse(reply)


class FakeChats:
    def __init__(self, replies):
        self.replies = replies
        self.created = []

    def create(self, model, config):
        chat = FakeChat(self.replies)
        self.created.append({'model': model, 'config': config, 'chat': chat})
        return chat


class FakeModels:
    def __init__(self, reply):
        self.reply = reply

    def generate_content(self, model, contents):
        if isinstance(self.reply, Exception):
            raise self.reply
        return FakeResponse(self.reply)


class FakeClient:
    def __init__(self, replies=None, generate_reply='tip'):
        self.chats = FakeChats(list(replies or []))
        self.models = FakeModels(generate_reply)


def instruction(created):
    config = created['config']
    return config['system_instruction'] if isinstance(config, dict) else config.system_instruction


def test_requires_api_key(monkeypatch):
    monkeypatch.setattr(tuffy_advisor.config, 'GEMINI_API_KEY', '')
    with pytest.raises(TuffyUnavailable):
        TuffyStyleAdvisor()


def test_session_uses_system_instruction_and_is_reused():
    client = FakeClient(['Hello mortal', 'Wear olive'])
    tuffy = TuffyStyleAdvisor(client=client, model='test-model')
    user_data = {'colorAnalysis': {'skintone': {'season': 'Autumn', 'undertone': 'Warm'}}, 'gender': 'Female'}

    first = tuffy.get_chat_response('u1', 'hi', user_data)
    second = tuffy.get_chat_response('u1', 'what colors?', user_data)

    assert first['success'] and first['tuffy_says'] == 'Hello mortal'
    assert second['message_count'] == 2
    assert len(client.chats.created) == 1
    created = client.chats.created[0]
    assert created['model'] == 'test-model'
    assert 'Seasonal Type: Autumn' in instruction(created) and 'Olive' in instruction(created)
    # Only the user's messages are sent; the persona is not a chat turn.
    assert created['chat'].sent == ['hi', 'what colors?']


def test_sessions_are_bounded():
    tuffy = TuffyStyleAdvisor(client=FakeClient(['a', 'b', 'c']), max_sessions=2)
    for user in ('u1', 'u2', 'u3'):
        tuffy.get_chat_response(user, 'hi', {})
    assert list(tuffy.chat_sessions) == ['u2', 'u3']


def test_errors_and_empty_replies_are_reported_without_internals():
    tuffy = TuffyStyleAdvisor(client=FakeClient([RuntimeError('quota exceeded for key AIza...'), '']))
    failed = tuffy.get_chat_response('u1', 'hi', {})
    assert failed['success'] is False and 'AIza' not in str(failed)
    assert 'u1' not in tuffy.chat_sessions
    assert tuffy.get_chat_response('u1', 'hi', {})['success'] is False


def test_style_tip_falls_back_to_rules():
    tuffy = TuffyStyleAdvisor(client=FakeClient(generate_reply=RuntimeError('down')))
    tip = tuffy.get_style_tip({'colorAnalysis': {'skintone': {'season': 'Winter'}}})
    assert 'Winter' in tip and 'royal blue' in tip


def test_rule_based_tip_without_profile():
    assert rule_based_style_tip({}) .startswith('✨')
